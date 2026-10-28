# Hackathon Skeleton

Стартовый каркас для хакатон-проекта. Сейчас в нём настроены React/Vite frontend, Node.js backend, Docker Compose, nginx и CI. **Полноценный совместный редактор ещё нужно реализовать**: текущие `/health` и `/status` предназначены для проверки инфраструктуры.

## Быстрый запуск через Docker

Требуется установленный и запущенный Docker Desktop (с Docker Compose).

В PowerShell из корня репозитория:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Открой .env и заполни CLOUDPUB_TOKEN, только если нужен публичный туннель.
docker compose config --quiet
docker compose up -d --build backend web
docker compose ps
curl.exe -fS http://localhost:8081/health
curl.exe -fSI http://localhost:8081/
```

Ожидается:

- `backend` и `web` имеют статус `healthy`;
- `/health` возвращает JSON с `"ok":true`;
- `/` возвращает HTTP 200.

Для публичной ссылки, если в корневом `.env` уже указан действующий `CLOUDPUB_TOKEN`:

```powershell
docker compose up -d tunnel
docker compose logs --tail=80 tunnel
```

Открой полученный URL на телефоне через мобильный интернет - так проверяется доступ извне, а не только из той же сети Wi-Fi.

Остановить контейнеры:

```powershell
docker compose down
```

Не используй `docker compose down -v`, если намеренно не собираешься удалять постоянные тома. По мере добавления сохранения документов в Compose могут появиться тома с пользовательскими данными.

## Локальная разработка

Для разработки удобнее запускать frontend и backend отдельно: так изменения кода быстрее видны, чем при постоянной пересборке Docker-образов. Требуется Node.js **26.x** и npm.

**Терминал 1 - backend:**

```powershell
cd backend
npm ci
npm start
```

Backend слушает порт `8080`. Проверка в другом терминале:

```powershell
curl.exe -fS http://127.0.0.1:8080/health
```

**Терминал 2 - frontend:**

```powershell
cd frontend
npm ci
npm run dev
```

Открой `http://localhost:5173`. Vite перенаправляет `/health` и `/status` на локальный backend через dev proxy. Для новых API-маршрутов и WebSocket proxy нужно будет согласовать настройки с интегратором и DevOps.

Файлы `backend/.env` и `frontend/.env` можно создать из шаблонов, если нужно переопределить порт:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

`backend/.env` задаёт локальный `PORT` (по умолчанию `8080`), `frontend/.env` - порт Vite `APP_PORT` (по умолчанию `5173`). В Docker порты контейнеров задаются через корневой `.env` и `compose.yaml`.

## Адреса и порты

| Адрес/порт | Назначение |
|---|---|
| `http://localhost:5173` | Frontend в режиме локальной разработки |
| `http://127.0.0.1:8080` | Backend, запущенный напрямую через Node.js |
| `http://localhost:8081` | Frontend через nginx в Docker Compose |
| `backend:8080` | Backend из других контейнеров Compose; это внутренний адрес, не адрес для браузера на хосте |
| `web:80` | Nginx для контейнера туннеля |

В текущей конфигурации `8081:80` опубликован для локальной проверки. Backend напрямую на хостовый порт не публикуется.

## Переменные окружения

| Файл/переменная | Для чего используется |
|---|---|
| `.env` в корне | Docker Compose: `BACKEND_PORT` и `CLOUDPUB_TOKEN` |
| `backend/.env` -> `PORT` | Порт backend при запуске через `npm start` вне Docker |
| `frontend/.env` -> `APP_PORT` | Порт Vite в локальном режиме разработки |
| `CLOUDPUB_TOKEN` | Секрет для запуска публичного туннеля; не коммить и не присылай в чат |

Не задавай секреты через переменные `VITE_*`: они попадают в клиентский код и доступны пользователю браузера.

`BACKEND_PORT` сейчас должен оставаться `8080`: это значение используется Compose, а nginx проксирует запросы на `backend:8080`. Если порт меняется, нужно согласованно обновить Compose и `frontend/nginx.conf`.

## Проверки и диагностика

```powershell
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 web
docker compose logs --tail=100 tunnel
docker compose exec web nginx -t
docker compose config --quiet
```

- Страница не открывается: проверь `docker compose ps` и логи `web`.
- `/health` не возвращает JSON: проверь логи backend и правило `/health` в `frontend/nginx.conf`.
- Локально работает, но с публичного URL нет: проверь `CLOUDPUB_TOKEN`, логи `tunnel` и протестируй ссылку через мобильный интернет.
- После изменения кода контейнера обновления не появились: пересобери образ (`docker compose up -d --build backend web`). Docker Compose сейчас не монтирует исходники внутрь контейнеров.
- `npm ci` завершился ошибкой: проверь наличие актуального `package-lock.json` в соответствующей папке.

Текущий backend предоставляет `GET /health` (JSON, HTTP 200) и `GET /status` (диагностическая HTML-страница). Другие API-эндпоинты, синхронизацию Yjs и сохранение документов ещё нужно реализовать.

## CI и работа в команде

GitHub Actions проверяет контракт backend `/health` и сборку frontend (`npm run build`). CI запускается при `push` в `main`/`master` и при PR в эти ветки. Сейчас CI не собирает Docker-образы и не проверяет совместную работу через WebSocket.

Рекомендуемый поток работы:

1. Каждый делает отдельную ветку, например `feature/editor-toolbar` или `feature/yjs-sync`.
2. Сразу после первого push открывает PR в `main`, при необходимости как Draft, чтобы CI запускался.
3. Перед merge проверяет CI и не перезаписывает чужие изменения в `compose.yaml`, `frontend/nginx.conf` и `.github/workflows/ci.yml` без согласования с DevOps.

## Документация по частям проекта

- [BACKEND_README.md](BACKEND_README.md) - backend и контракт `/health`.
- [UI_README.md](UI_README.md) - frontend, Vite proxy и правила сборки.
- [docs/DEPLOY.md](docs/DEPLOY.md) - подготовка ноутбука, запуск Compose и публичный туннель.
