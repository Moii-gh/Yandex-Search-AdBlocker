// Яндекс Блокировщик Рекламы - Popup Script

document.addEventListener('DOMContentLoaded', function() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const blockedCount = document.getElementById('blockedCount');
    const totalBlocked = document.getElementById('totalBlocked');
    const toggleButton = document.getElementById('toggleButton');
    
    // Получаем текущую вкладку
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        // Проверяем, является ли текущая страница страницей Яндекса
        if (currentTab.url.includes('yandex.ru') || currentTab.url.includes('yandex.com')) {
            // Получаем статистику блокировки для текущей страницы
            chrome.tabs.sendMessage(currentTab.id, {action: 'getStats'}, function(response) {
                if (response) {
                    updateStats(response.blockedCount || 0);
                }
            });
            
            // Получаем общую статистику
            chrome.storage.local.get(['totalBlocked'], function(result) {
                totalBlocked.textContent = result.totalBlocked || 0;
            });
            
            // Получаем статус расширения для текущего сайта
            chrome.storage.local.get([currentTab.url], function(result) {
                const isDisabled = result[currentTab.url] === false;
                updateStatus(!isDisabled);
            });
            
        } else {
            // Если не на Яндексе, показываем соответствующий статус
            statusDot.style.background = '#ccc';
            statusText.textContent = 'Неактивен (не Яндекс)';
            toggleButton.disabled = true;
            toggleButton.classList.add('disabled');
            toggleButton.textContent = 'Работает только на Яндексе';
        }
    });
    
    // Обработчик кнопки включения/отключения
    toggleButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            
            chrome.storage.local.get([currentTab.url], function(result) {
                const isCurrentlyDisabled = result[currentTab.url] === false;
                const newStatus = isCurrentlyDisabled;
                
                // Сохраняем новый статус
                chrome.storage.local.set({[currentTab.url]: newStatus}, function() {
                    updateStatus(newStatus);
                    
                    // Перезагружаем страницу для применения изменений
                    chrome.tabs.reload(currentTab.id);
                });
            });
        });
    });
    
    function updateStatus(isEnabled) {
        if (isEnabled) {
            statusDot.style.background = '#4CAF50';
            statusText.textContent = 'Активен';
            toggleButton.textContent = 'Отключить на этом сайте';
            toggleButton.classList.remove('disabled');
        } else {
            statusDot.style.background = '#ff6b6b';
            statusText.textContent = 'Отключен';
            toggleButton.textContent = 'Включить на этом сайте';
            toggleButton.classList.remove('disabled');
        }
    }
    
    function updateStats(blocked) {
        blockedCount.textContent = blocked;
        
        // Обновляем общую статистику
        chrome.storage.local.get(['totalBlocked'], function(result) {
            const currentTotal = result.totalBlocked || 0;
            const newTotal = currentTotal + blocked;
            chrome.storage.local.set({totalBlocked: newTotal});
            totalBlocked.textContent = newTotal;
        });
    }
});

