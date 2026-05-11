# Yandex Search AdBlocker

<p align="center">
  <img src="./assets/readme-banner.png" alt="Yandex Search AdBlocker очищает рекламные блоки" width="100%">
</p>

Расширение Manifest V3 для Chrome, Chromium и Edge. Скрывает рекламные блоки в поисковой выдаче Яндекса и старается не трогать обычные результаты.

## Что делает

Расширение запускает `content.js` на страницах поиска Яндекса. Скрипт смотрит на классы рекламных контейнеров, ссылки на рекламные домены, короткие метки вроде `реклама` и отдельные рекламные токены в атрибутах.

Фильтр намеренно строгий: он не проверяет весь текст результата на слово `ad`, чтобы не скрывать сайты и статьи со словами вроде `Adobe`, `Advanced` или `adapter`.

## Установка

1. Откройте в Chrome, Chromium или Edge страницу `chrome://extensions/`.
2. Включите режим разработчика.
3. Нажмите **Загрузить распакованное расширение**.
4. Выберите корневую папку проекта:

```text
C:\Users\user\Desktop\Yandex-Search-AdBlocker-main
```

После установки откройте поиск Яндекса. Если вкладка уже была открыта, обновите страницу.

## Поддерживаемые страницы

```text
https://yandex.ru/search*
https://yandex.com/search*
https://ya.ru/search*
https://*.yandex.ru/search*
https://*.yandex.com/search*
https://*.ya.ru/search*
```

## Как устроена фильтрация

| Проверка | Пример |
| --- | --- |
| Явные классы рекламных блоков | `.serp-adv`, `.direct-item`, `.direct-wrapper` |
| Рекламные ссылки | `an.yandex.*`, `yabs.yandex.*`, `awaps.yandex.*` |
| Короткие рекламные метки | `реклама`, `промо`, `ad`, `promo`, `sponsored` |
| Токены в атрибутах | `adv`, `advert`, `serp-adv` как отдельные токены |

`MutationObserver` следит за подгрузкой новых результатов. Чтобы не гонять фильтр на каждую мелкую DOM-мутацию, повторный проход запускается с небольшой задержкой.

## Структура проекта

```text
.
├── manifest.json                  # Манифест для загрузки из корня проекта
├── assets/                        # Изображения для документации, расширение их не использует
└── yandex-ad-blocker/
    ├── content.js                 # Поиск и скрытие рекламных блоков
    ├── styles.css                 # CSS для рекламных элементов на странице поиска
    ├── style.css                  # Внешний вид попапа расширения
    ├── popup.html                 # Разметка попапа расширения
    ├── popup.js                   # Статус, статистика и переключатель для текущей страницы
    ├── manifest.json              # Манифест для загрузки подпапки отдельно
    ├── logo-source.png            # Исходник логотипа
    └── icon*.png                  # Иконки расширения 16/48/128
```

## Проверка перед загрузкой

Проверить JavaScript:

```bash
node --check yandex-ad-blocker/content.js
node --check yandex-ad-blocker/popup.js
```

Проверить JSON манифеста:

```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('yandex-ad-blocker/manifest.json','utf8'))"
```

После изменений в `content.js`, `styles.css`, `style.css` или `manifest.json` перезагрузите расширение на странице `chrome://extensions/`.

## Примечание

Проект не является официальным продуктом Яндекса и не связан с компанией Яндекс. Названия сервисов используются только для описания совместимости расширения.

## Лицензия

MIT.
