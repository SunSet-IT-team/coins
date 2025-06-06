# Как же удобно локально запустить разработку?

Для локальной разработки у Вас должен быть установлен docker (docker desktop)

## Какие сервисы есть

mongo - Тут находится вся бдшка
backend - Это сам сервер и самое приложение
frontend - Webpack сервер, который раздаёт статику (стили, скрипты и тп )

## Как всё запустить?

Нужно перекинуть себе .env файл открыть консоль в проекте и написать

```
docker compose build --no-cache
docker compose up -d
```

Потом контейнеры можно запускать через через docker desktop, либо же писать в консоли

```
docker compose up -d
```

!!!ВНИМАНИЕ!!!
Контейнеры долго запусаются, поэтому нужно подождать (в районе 5 мин после запуска контейнера), либо посмотреть по логам, чтобы и в backend и в frontend было написано 'listening on port 3003' и ' Local: http://localhost:4000⁠' соответственно

!!!ВНИМАНИЕ!!!
После первой сборки нужно зайти в backend контейнер:
Можно либо через программу (docker decktop) - зайти на вкладку "containers", нажать на "pl-backend", затем нажать на "Exec" - там будет терминал

Либо в локальном терминале проекта

```
docker exec -it pl-backend bash   # если установлен bash
```

ИЛИ

```
docker exec -it pl-backend sh     # если bash не установлен
```

После чего выполнить команду

```
yarn seeds
```

Она добавит в базу данных нужные данные

## Как всё работает

После запуска контейнера мы можем открыть наше приложение в браузере (http://localhost:3003/)

У нас настроен Hot-Reload, поэтому при любом именении внутри папки src/apps будет происходить пересборка проекта и сайт будет меняться без обновления страницы. Ориентировочно сборка занимает 5 - 15 сек +-

В админку можно попасть через
http://localhost:3003/adminus

admin
Aa123456

## Деплой на dev

Нужно подключиться по ftp, загрузить изменённые файлы
Затем поключиться по ssh зайти в папку с проектом и написать yarn deploy

Позже будет обновление с ci/cd
