<p align="center">
  <img src="./assets/readme-banner.png" alt="Yandex Search AdBlocker очищает рекламные блоки" width="100%">
</p>

<h1 align="center">Yandex Search AdBlocker</h1>

<p align="center">
  Чистая поисковая выдача Яндекса без навязчивых рекламных и промо-блоков.
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-2D7FEA?style=for-the-badge">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome%20%2F%20Edge-ready-19C37D?style=for-the-badge">
  <img alt="No build" src="https://img.shields.io/badge/No%20Build-needed-FFCC00?style=for-the-badge&labelColor=20242E">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-FC3F1D?style=for-the-badge">
</p>

## Что это

**Yandex Search AdBlocker** - легкое браузерное расширение, которое скрывает рекламные блоки в поисковой выдаче Яндекса. Оно не ломает строку поиска, не трогает обычные результаты и работает прямо на странице через content-script.

Проект сфокусирован на точности: расширение ищет явные рекламные контейнеры, промо-метки и рекламные ссылки, а не прячет все элементы, где случайно встретились буквы `ad`.

## Возможности

| Возможность | Что делает |
| --- | --- |
| Точное скрытие рекламы | Убирает блоки с явными рекламными признаками: `реклама`, `промо`, `sponsored`, рекламные домены Яндекса |
| Защита от ложных срабатываний | Не скрывает обычные результаты вроде `Adobe`, `Advanced`, `adapter`, `direct answer` |
| Динамическое наблюдение | Следит за подгружаемыми результатами и скрывает новую рекламу без перезагрузки |
| Управление через попап | Показывает статус и статистику, позволяет отключить блокировку для текущей страницы |
| Без сборки | Открываете папку в браузере - расширение готово к работе |

## Быстрый старт

1. Скачайте или распакуйте проект.
2. Откройте в Chrome, Chromium или Edge страницу `chrome://extensions/`.
3. Включите режим разработчика.
4. Нажмите **Загрузить распакованное расширение**.
5. Выберите корневую папку проекта:

```text
C:\Users\user\Desktop\Yandex-Search-AdBlocker-main
```

После установки откройте поиск Яндекса и обновите страницу, если вкладка уже была открыта.

## Как работает фильтрация

Расширение использует несколько независимых проверок:

| Проверка | Пример |
| --- | --- |
| Явные классы рекламных блоков | `.serp-adv`, `.direct-item`, `.direct-wrapper` |
| Рекламные ссылки | `an.yandex.*`, `yabs.yandex.*`, `awaps.yandex.*` |
| Короткие рекламные метки | `реклама`, `промо`, `ad`, `promo`, `sponsored` |
| Токены в атрибутах | `adv`, `advert`, `serp-adv` как отдельные токены |

Важно: проверка текста намеренно строгая. Расширение не сканирует весь текст результата на слово `Ad`, чтобы не скрывать полезные сайты и материалы.

## Поддерживаемые страницы

```text
https://yandex.ru/search*
https://yandex.com/search*
https://ya.ru/search*
https://*.yandex.ru/search*
https://*.yandex.com/search*
https://*.ya.ru/search*
```

## Структура проекта

```text
.
├── manifest.json                  # Манифест для загрузки из корня проекта
├── assets/
│   ├── readme-banner.png          # Сгенерированный баннер README
│   └── extension-logo-source.png  # Исходник сгенерированного логотипа
└── yandex-ad-blocker/
    ├── content.js                 # Основная логика блокировки
    ├── styles.css                 # Скрытие помеченных элементов
    ├── popup.html                 # Интерфейс расширения
    ├── popup.js                   # Логика попапа
    ├── manifest.json              # Манифест для загрузки подпапки
    ├── logo-source.png            # Исходник логотипа для расширения
    └── icon*.png                  # Иконки расширения 16/48/128
```

## Разработка

Проверить JavaScript:

```bash
node --check yandex-ad-blocker/content.js
node --check yandex-ad-blocker/popup.js
```

Проверить JSON манифеста:

```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
```

После изменений в `content.js`, `styles.css` или `manifest.json` перезагрузите расширение на странице `chrome://extensions/`.

## Примечание

Проект не является официальным продуктом Яндекса и не связан с компанией Яндекс. Названия сервисов используются только для описания совместимости расширения.

## Лицензия

MIT. Используйте, изменяйте и распространяйте проект свободно.
