// Яндекс Блокировщик Рекламы - Content Script
// Блокирует рекламные блоки в поисковой выдаче Яндекса

(function() {
    'use strict';

    // Список CSS селекторов для рекламных блоков в Яндексе
    // Убраны слишком общие селекторы, которые могли затронуть строку поиска или другие элементы интерфейса
    const adSelectors = [
        // Основные рекламные блоки с явными признаками рекламы
        '[data-cid*="adv"]',
        '[data-cid*="ad"]',
        '.serp-adv__item',
        '.serp-adv__wrapper',
        '.serp-adv__link',
        '.serp-adv',
        '.serp-item[data-cid*="adv"]',
        '.serp-item[data-cid*="ad"]',
        '.organic[data-cid*="adv"]',
        '.organic[data-cid*="ad"]',
        
        // Блоки Direct (Яндекс.Директ)
        '.direct-item',
        '.direct-wrapper',
        '.serp-item[data-bem*="direct"]',
        
        // Баннерные и промо блоки, если они не являются частью основного интерфейса
        '.banner-item',
        '.promo-block',
        '.promotional',

        // Дополнительные селекторы, которые могут быть рекламными, но не затрагивают основные элементы
        '.b-banner',
        '.b-ads',
        '.b-direct',
        '.b-promo'
    ];

    // Функция для скрытия элементов по селекторам
    function hideAds() {
        adSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element && !element.getAttribute('data-yandex-ad-blocked')) {
                        element.style.display = 'none !important';
                        element.style.visibility = 'hidden !important';
                        element.style.opacity = '0 !important';
                        element.style.height = '0 !important';
                        element.style.overflow = 'hidden !important';
                        element.setAttribute('data-yandex-ad-blocked', 'true');
                        // console.log('Заблокирован рекламный элемент:', element);
                    }
                });
            } catch (e) {
                // Игнорируем ошибки для невалидных селекторов
            }
        });
    }

    // Функция для поиска и скрытия элементов с текстом "Реклама"
    function hideAdsByText() {
        // Ищем только внутри потенциальных контейнеров результатов поиска, чтобы не затронуть другие элементы
        const potentialAdContainers = document.querySelectorAll('.serp-item, .organic');

        potentialAdContainers.forEach(container => {
            // Проверяем текст внутри контейнера, но не сам контейнер, если он не рекламный
            if (container.innerText.includes('Реклама') || 
                container.innerText.includes('реклама') ||
                container.innerText.includes('Ad') ||
                container.innerText.includes('Sponsored')) {
                
                // Дополнительная проверка, чтобы убедиться, что это действительно рекламный блок
                // Например, ищем внутри контейнера элементы с пометкой 

