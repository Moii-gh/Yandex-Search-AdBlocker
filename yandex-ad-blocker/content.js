// Контент-скрипт работает прямо на странице поиска: ищет рекламные признаки в DOM и скрывает найденные блоки.
(function() {
    'use strict';

    // Атрибут нужен как CSS-хук и как защита от повторного подсчета одного и того же блока.
    const BLOCKED_ATTR = 'data-yandex-ad-blocked';

    // Эти контейнеры можно скрывать целиком: внутри обычно лежит отдельный результат выдачи или рекламный виджет.
    const RESULT_CONTAINER_SELECTOR = [
        '.serp-item',
        '.organic',
        '.serp-adv',
        '.serp-adv__item',
        '.serp-adv__wrapper',
        '.direct-item',
        '.direct-wrapper'
    ].join(', ');

    // Явные рекламные классы Яндекса. Если такой узел найден внутри результата, скрываем весь результат.
    const DIRECT_AD_SELECTORS = [
        '.serp-adv',
        '.serp-adv__item',
        '.serp-adv__wrapper',
        '.serp-adv__link',
        '.direct-item',
        '.direct-wrapper'
    ];

    // Рекламные домены встречаются даже тогда, когда видимая метка "реклама" спрятана глубже в разметке.
    const AD_LINK_SELECTORS = [
        'a[href*="//an.yandex."]',
        'a[href*="//yabs.yandex."]',
        'a[href*="//awaps.yandex."]',
        'a[href*="//yandexadexchange."]'
    ];

    // Проверяем короткие подписи и служебные атрибуты. Полный текст результата не трогаем, чтобы не ловить "ad" в обычных словах.
    const AD_MARKER_SELECTORS = [
        '.label',
        '.organic__label',
        '.organic__subtitle',
        '.serp-item__label',
        '[aria-label]',
        '[title]'
    ];

    // Интерфейс поиска не скрываем, даже если внутри Яндекс использует похожие классы или data-атрибуты.
    const SEARCH_UI_SELECTOR = [
        'html',
        'body',
        'header',
        'nav',
        'form',
        '[role="search"]',
        '.search-input',
        '.search-input__text',
        '.search-input__button',
        '.search3',
        '.mini-suggest',
        '.navigation'
    ].join(', ');

    // Только короткие рекламные метки. Сниппеты и заголовки результатов проходят отдельную защиту по длине.
    const AD_LABELS = new Set([
        'реклама',
        'на правах рекламы',
        'промо',
        'ad',
        'ads',
        'promo',
        'sponsored',
        'advertisement',
        'advertising'
    ]);

    let blockedCount = 0;
    let observer = null;
    let scanTimer = null;
    let totalStatsTimer = null;
    let pendingTotalIncrement = 0;

    function hideElement(element) {
        if (!element || element.getAttribute(BLOCKED_ATTR) === 'true' || shouldKeepVisible(element)) {
            return false;
        }

        element.setAttribute(BLOCKED_ATTR, 'true');

        // Инлайн-стили дублируют CSS-правило: так блок остается скрытым после динамических перерисовок выдачи.
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('opacity', '0', 'important');
        element.style.setProperty('height', '0', 'important');
        element.style.setProperty('overflow', 'hidden', 'important');

        recordBlockedElement();
        return true;
    }

    function recordBlockedElement() {
        blockedCount += 1;
        pendingTotalIncrement += 1;
        scheduleTotalStatsFlush();
    }

    function scheduleTotalStatsFlush() {
        if (totalStatsTimer || !canUseChromeStorage()) {
            return;
        }

        // За один проход может скрыться несколько блоков, поэтому пишем статистику пачкой.
        totalStatsTimer = setTimeout(flushTotalStats, 250);
    }

    function flushTotalStats() {
        const increment = pendingTotalIncrement;
        pendingTotalIncrement = 0;
        totalStatsTimer = null;

        if (!increment || !canUseChromeStorage()) {
            return;
        }

        chrome.storage.local.get(['totalBlocked'], result => {
            const currentTotal = Number(result.totalBlocked) || 0;
            chrome.storage.local.set({ totalBlocked: currentTotal + increment });
        });
    }

    function shouldKeepVisible(element) {
        if (element.matches(SEARCH_UI_SELECTOR)) {
            return true;
        }

        // Если рекламный признак поднялся до родителя с полем поиска, лучше пропустить блок, чем сломать страницу.
        return Boolean(element.querySelector([
            'input[type="search"]',
            'input[name="text"]',
            'textarea',
            '.search-input__text',
            '.search3__input'
        ].join(', ')));
    }

    function closestBlockTarget(element) {
        const target = element.closest(RESULT_CONTAINER_SELECTOR);
        return target || element;
    }

    function hasAdToken(value) {
        if (!value) {
            return false;
        }

        // Ищем отдельный рекламный токен, а не совпадение внутри "adapter", "Adobe" или похожих слов.
        return /(^|[^a-z0-9])(ad|ads|adv|advert|serp-adv)([^a-z0-9]|$)/i.test(value);
    }

    function hasAdClass(value) {
        if (!value) {
            return false;
        }

        // В className разделителями часто бывают пробел, дефис и подчеркивание.
        return /(^|[\s_-])(adv|advert|serp-adv|direct-item|direct-wrapper)([\s_-]|$)/i.test(value);
    }

    function hasAdMarkerText(container) {
        const markedElements = Array.from(container.querySelectorAll(AD_MARKER_SELECTORS.join(', ')));
        const shortTextElements = Array.from(container.querySelectorAll('*')).filter(element => {
            const text = getOwnText(element);
            return text && text.length <= 80;
        });

        return markedElements.concat(shortTextElements).some(marker => {
            const values = [
                getOwnText(marker),
                marker.getAttribute('aria-label'),
                marker.getAttribute('title')
            ];

            return values.some(isAdLabel);
        });
    }

    function isAdLabel(value) {
        if (!value) {
            return false;
        }

        const text = value.replace(/\s+/g, ' ').trim().toLowerCase();
        if (!text || text.length > 80) {
            return false;
        }

        return AD_LABELS.has(text) ||
            text.startsWith('реклама:') ||
            text.startsWith('промо:');
    }

    function getOwnText(element) {
        return Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function hasAdLink(container) {
        return AD_LINK_SELECTORS.some(selector => container.querySelector(selector));
    }

    function hasAdAttributes(container) {
        return hasAdToken(container.getAttribute('data-cid')) ||
            hasAdToken(container.getAttribute('data-bem')) ||
            hasAdClass(container.className);
    }

    function scanForAds() {
        // Сначала убираем очевидные рекламные узлы, затем проверяем обычные контейнеры по ссылкам, меткам и атрибутам.
        DIRECT_AD_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                hideElement(closestBlockTarget(element));
            });
        });

        document.querySelectorAll(RESULT_CONTAINER_SELECTOR).forEach(container => {
            if (container.getAttribute(BLOCKED_ATTR) === 'true') {
                return;
            }

            if (hasAdAttributes(container) || hasAdLink(container) || hasAdMarkerText(container)) {
                hideElement(container);
            }
        });
    }

    function scheduleScan() {
        if (scanTimer) {
            return;
        }

        // Выдача обновляется пачками DOM-мутаций. Небольшая задержка склеивает их в один проход.
        scanTimer = setTimeout(() => {
            scanTimer = null;
            scanForAds();
        }, 150);
    }

    function startBlocking() {
        scanForAds();

        // Нужен для догрузки результатов и внутренних переходов без полной перезагрузки страницы.
        observer = new MutationObserver(scheduleScan);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function setupMessages() {
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
            return;
        }

        // Попап не видит DOM страницы, поэтому запрашивает счетчик у контент-скрипта активной вкладки.
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request && request.action === 'getStats') {
                sendResponse({ blockedCount });
            }
        });
    }

    function canUseChromeStorage() {
        return Boolean(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local);
    }

    function init() {
        setupMessages();

        if (!canUseChromeStorage()) {
            startBlocking();
            return;
        }

        // Ключом остается полный URL: пользователь отключает блокировку для конкретной страницы выдачи.
        chrome.storage.local.get([window.location.href], result => {
            if (result[window.location.href] !== false) {
                startBlocking();
            }
        });
    }

    init();
})();
