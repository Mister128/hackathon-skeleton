# Hackathon Skeleton

Веб-приложение для совместного редактирования документа в реальном времени.

Документы по ролям:
- [BACKEND_README.md](BACKEND_README.md) - сервер и контракт `/health`
- [UI_README.md](UI_README.md) - фронт и подключение к бэкенду
- [docs/DEPLOY.md](docs/DEPLOY.md) - запуск на ноутбуке и на VPS

## Структура
```
backend/   Node-сервер: /health, /status, позже Yjs
frontend/  Vite + TypeScript + React (в docker - nginx со статикой)
docs/      запуск и деплой
```

## Требования
Node **26.x**, npm (в комплекте). Версия зафиксирована в четырёх местах, они
обязаны совпадать: `backend/package.json -> engines`,
`frontend/package.json -> engines`, `.github/workflows/ci.yml`, этот файл.

## Порты (контракт, меняется только через PR)
| Порт | Кто               | Что                                          |
| ---- | ----------------- | -------------------------------------------- |
| 8080 | backend           | сервер, `/health`, `/status`                 |
| 5173 | frontend          | Vite dev-сервер (только `npm run dev`)       |
| 80   | frontend в docker | nginx: статика + прокси `/health`, `/status` |
| 8081 | web -> хост       | отладочная дверь с ноутбука, на VPS убрать   |

Порт нельзя «временно поправить на месте». Если нужен другой - PR + эта таблица
+ `frontend/nginx.conf` (там `proxy_pass http://backend:8080` захардкожен).

## Переменные
Каждая служба локально читает **свой** `.env`, рядом с её `package.json`.

| Тип    | Переменная       | Кто читает           | Смысл                        |
| ------ | ---------------- | -------------------- | ---------------------------- |
| BIND   | `PORT`           | backend (локально)   | на каком порту слушать       |
| BIND   | `BACKEND_PORT`   | compose -> контейнер | он же, из `.env` в корне     |
| BIND   | `APP_PORT`       | frontend dev (vite)  | порт vite, по умолчанию 5173 |
| СЕКРЕТ | `CLOUDPUB_TOKEN` | compose -> tunnel    | адрес публичного URL         |

BIND = «куда я втыкаю вилку», CALL = «кому я звоню». У двух BIND-сервисов
общая переменная `PORT` даёт конфликт портов, поэтому имена разные.

CALL-переменных сейчас нет: запросы относительные (`/health`), в dev их
перенаправляет dev-proxy, в проде - nginx. Прямой вызов на другой origin -
сначала к DevOps.

**В контейнере порт задаёт compose через `environment:`, а не `.env`**
(файла внутри образа нет намеренно - `.dockerignore`).

### `.env` в корне - для compose, не для служб
```
BACKEND_PORT=8080
CLOUDPUB_TOKEN=<из дашборда cloudpub>
```
Если `BACKEND_PORT` не определена, compose подставит **пустую строку без ошибки**: бэкенд уйдёт на fallback, healthcheck посмотрит не в тот порт, и `web` не стартует никогда. Проверка перед `up`: `docker compose config`.

## Быстрый старт
PowerShell / bash, в каждой папке своя копия примера:
```powershell
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Дальше - [BACKEND_README.md](BACKEND_README.md) и [UI_README.md](UI_README.md).

## Docker (одна команда, ноутбук или VPS)
Запуск:
```bash
cp .env.example .env         # вписать CLOUDPUB_TOKEN
docker compose config        # валидация, unset-переменные, resolved-вид
docker compose build
docker compose up -d
docker compose ps            # backend (healthy), web (healthy)
docker compose logs tunnel   # публичный URL для жюри
```
Первые проверки по порядку:
```bash
docker compose exec web nginx -t
curl http://localhost:8081/          # HTML от nginx
curl http://localhost:8081/health    # JSON через nginx (статика + прокси + бэкенд)
```
Остановка:
```bash
docker compose stop   # пауза
docker compose down   # стоп
```
> Не используй `down -v`: сносит тома, состояние агента и публичный URL.

`restart: unless-stopped` на всех сервисах: после ребута или обрыва сети стек
поднимается сам, адрес не уезжает. Ручная проверка (один раз, не перед сценой):
```bash
docker kill $(docker compose ps -q backend)   # через ~30 с вернётся сам
```

## LAN
Хост сервера пишет свой IP в чат команды (на ноутбуке - DevOps).
Узнать IP: `ipconfig` (Windows) / `hostname -I` (Linux), или `ip.js -> getLocalIps()`
печатает список адаптеров при запуске.

| Кому                             | Адрес                                                            |
| -------------------------------- | ---------------------------------------------------------------- |
| жюри                             | URL из `docker compose logs tunnel`                              |
| команда, docker на этом же ноуте | `http://localhost:8081`                                          |
| команда, LAN без docker          | бэкенд `http://<IP>:8080/status`, фронт `http://<IP>:<APP_PORT>` |

Сервер слушает `0.0.0.0` - на всех интерфейсах машины. Наружу дополнительно
опубликован только `8081:80`, и это отладочная дверь с хоста (на VPS меняется
или убирается): туннель сам выходит к провайдеру, входящих портов ему не нужно.

В браузере чужой машины может не хватить HMR-соединения (vite документирует это
в Guide -> Features): если UI «не обновляется сам» - перезагрузка F5 работает
всегда, это не баг бэкенда.

## CI (`.github/workflows/ci.yml`)
Два независимых job, параллельно, без `needs` - **имя job и есть ответ на вопрос
«чей это красный»**. Запускается на `push`/`pull_request` в `main`/`master`:
коммит в свою ветку без PR не проверяется ничем, поэтому открывайте PR сразу
после первого push (draft - можно).

- `backend`: `npm ci` -> запуск в фоне -> три отдельные проверки `/health`
  (тело `"ok":true`, заголовок `application/json`, код ровно `200`) -> `kill`.
  При падении отдельный шаг печатает `backend/server.log` (`if: failure()`).
  LAN-адресов в CI нет намеренно: раннер не в вашей сети.
- `frontend`: `npm ci && npm run build` (там же `tsc`) -> upload `frontend/dist`
  -> **гард**: в собранном бандле не должно быть `http://localhost:8080` и
  `http://127.0.0.1:8080`. Красный здесь = абсолютный URL в коде, нужен
  относительный (`fetch('/health')`). Ограничение гарда: `VITE_*` он не видит,
  потому что `.env` не коммитится.

## Частые проблемы
- `EADDRINUSE` - порт занят: у бэкенда `PORT` в `backend/.env`, у vite
  `APP_PORT` в `frontend/.env`, в docker - `BACKEND_PORT` в `.env` (конфликт
  с процессом на хосте). Сменить, перезапустить.
- `.env not found` в логе - предупреждение, **не ошибка**: сервер поднялся на
  8080. Сделай Быстрый старт.
- Публичный URL отдаёт `ping` или `The main page` вместо UI - туннель смотрит на
  бэкенд, а не на `web` (в compose должно быть `HTTP=web:80`).
- `curl http://localhost:8081/health` вернул HTML вместо JSON - `location` в
  nginx не сматчился. При этом `curl http://localhost:8081/` HTML и должен
  отдавать - это не поломка.
- `docker compose ps`: web в `starting`/`unhealthy`, backend healthy - почти
  всегда `frontend/nginx.conf` (`proxy_pass`, `root`).
- `curl http://127.0.0.1:5173/health` вернул HTML после правки конфига - цель в
  `proxy` обязана быть `http://127.0.0.1:8080`, а не `http://localhost:8080`:
  `localhost` резолвится в IPv6 `[::1]`, а бэкенд слушает IPv4.
- `npm ci` ругается на lock-файл - `package-lock.json` закоммичен, не удалять;
  в CI и в Docker использовать только `npm ci`.

Вопросы по портам, туннелю и CI - DevOps.