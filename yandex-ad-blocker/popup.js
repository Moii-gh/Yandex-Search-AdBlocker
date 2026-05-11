// Попап показывает состояние активной вкладки. Поиск и скрытие рекламы выполняются в content.js.
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const blockedCount = document.getElementById('blockedCount');
    const totalBlocked = document.getElementById('totalBlocked');
    const toggleButton = document.getElementById('toggleButton');

    let activeTab = null;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        activeTab = tabs[0] || null;

        if (!activeTab || !isSupportedSearchPage(activeTab.url)) {
            showUnsupportedPageState();
            return;
        }

        loadPageStats(activeTab.id);
        loadTotalStats();
        loadPageStatus(activeTab.url);
    });

    toggleButton.addEventListener('click', function() {
        if (!activeTab || !isSupportedSearchPage(activeTab.url)) {
            return;
        }

        chrome.storage.local.get([activeTab.url], function(result) {
            const isDisabled = result[activeTab.url] === false;
            const nextEnabledState = isDisabled;

            // Значение false запрещает запуск контент-скрипта после перезагрузки вкладки. true или пустой ключ считаются включенным состоянием.
            chrome.storage.local.set({ [activeTab.url]: nextEnabledState }, function() {
                updateStatus(nextEnabledState);
                chrome.tabs.reload(activeTab.id);
            });
        });
    });

    function isSupportedSearchPage(url) {
        if (!url) {
            return false;
        }

        try {
            const parsedUrl = new URL(url);
            const host = parsedUrl.hostname;
            const isYandexHost = host === 'yandex.ru' ||
                host.endsWith('.yandex.ru') ||
                host === 'yandex.com' ||
                host.endsWith('.yandex.com') ||
                host === 'ya.ru' ||
                host.endsWith('.ya.ru');

            return isYandexHost && parsedUrl.pathname.startsWith('/search');
        } catch (error) {
            return false;
        }
    }

    function loadPageStats(tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'getStats' }, function(response) {
            if (chrome.runtime.lastError || !response) {
                blockedCount.textContent = '0';
                return;
            }

            blockedCount.textContent = response.blockedCount || 0;
        });
    }

    function loadTotalStats() {
        chrome.storage.local.get(['totalBlocked'], function(result) {
            totalBlocked.textContent = result.totalBlocked || 0;
        });
    }

    function loadPageStatus(url) {
        chrome.storage.local.get([url], function(result) {
            updateStatus(result[url] !== false);
        });
    }

    function showUnsupportedPageState() {
        statusDot.style.background = '#ccc';
        statusText.textContent = 'Неактивен';
        blockedCount.textContent = '0';
        loadTotalStats();

        toggleButton.disabled = true;
        toggleButton.classList.add('disabled');
        toggleButton.textContent = 'Откройте поиск Яндекса';
    }

    function updateStatus(isEnabled) {
        toggleButton.disabled = false;

        if (isEnabled) {
            statusDot.style.background = '#4CAF50';
            statusText.textContent = 'Активен';
            toggleButton.textContent = 'Отключить на этой странице';
            toggleButton.classList.remove('disabled');
            return;
        }

        statusDot.style.background = '#ff6b6b';
        statusText.textContent = 'Отключен';
        toggleButton.textContent = 'Включить на этой странице';
        toggleButton.classList.remove('disabled');
    }
});
