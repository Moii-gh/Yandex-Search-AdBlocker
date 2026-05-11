// Yandex Search AdBlocker - content script
(function() {
    'use strict';

    const BLOCKED_ATTR = 'data-yandex-ad-blocked';
    const RESULT_CONTAINER_SELECTOR = [
        '.serp-item',
        '.organic',
        '.serp-adv',
        '.serp-adv__item',
        '.serp-adv__wrapper',
        '.direct-item',
        '.direct-wrapper'
    ].join(', ');

    const DIRECT_AD_SELECTORS = [
        '.serp-adv',
        '.serp-adv__item',
        '.serp-adv__wrapper',
        '.serp-adv__link',
        '.direct-item',
        '.direct-wrapper'
    ];

    const AD_LINK_SELECTORS = [
        'a[href*="//an.yandex."]',
        'a[href*="//yabs.yandex."]',
        'a[href*="//awaps.yandex."]',
        'a[href*="//yandexadexchange."]'
    ];

    const AD_MARKER_SELECTORS = [
        '.label',
        '.organic__label',
        '.organic__subtitle',
        '.serp-item__label',
        '[aria-label]',
        '[title]'
    ];

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

    const AD_LABELS = new Set([
        '\u0440\u0435\u043a\u043b\u0430\u043c\u0430',
        '\u043d\u0430 \u043f\u0440\u0430\u0432\u0430\u0445 \u0440\u0435\u043a\u043b\u0430\u043c\u044b',
        '\u043f\u0440\u043e\u043c\u043e',
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

    function hideElement(element) {
        if (!element || element.getAttribute(BLOCKED_ATTR) === 'true' || shouldKeepVisible(element)) {
            return false;
        }

        element.setAttribute(BLOCKED_ATTR, 'true');
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('opacity', '0', 'important');
        element.style.setProperty('height', '0', 'important');
        element.style.setProperty('overflow', 'hidden', 'important');
        blockedCount += 1;
        return true;
    }

    function shouldKeepVisible(element) {
        if (element.matches(SEARCH_UI_SELECTOR)) {
            return true;
        }

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

        return /(^|[^a-z0-9])(ad|ads|adv|advert|serp-adv)([^a-z0-9]|$)/i.test(value);
    }

    function hasAdClass(value) {
        if (!value) {
            return false;
        }

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
            text.startsWith('\u0440\u0435\u043a\u043b\u0430\u043c\u0430:') ||
            text.startsWith('\u043f\u0440\u043e\u043c\u043e:');
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

        scanTimer = setTimeout(() => {
            scanTimer = null;
            scanForAds();
        }, 150);
    }

    function startBlocking() {
        scanForAds();

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

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request && request.action === 'getStats') {
                sendResponse({ blockedCount });
            }
        });
    }

    function init() {
        setupMessages();

        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            startBlocking();
            return;
        }

        chrome.storage.local.get([window.location.href], result => {
            if (result[window.location.href] !== false) {
                startBlocking();
            }
        });
    }

    init();
})();
