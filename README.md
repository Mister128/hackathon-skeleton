# Hackathon Skeleton

Веб-приложение для совместного редактирования документа в реальном времени.

Документы по ролям:
- [BACKEND_README.md](BACKEND_README.md) - сервер и контракт `/health`
- [UI_README.md](UI_README.md) - фронт и подключение к бэкенду
- [docs/DEPLOY.md](docs/DEPLOY.md) - запуск на ноутбуке и на VPS

## Структура
```
backend/   Node-сервер: /health, /status, позже Yjs
frontend/  Vite + TypeScript + React
docs/      запуск и деплой
```

## Требования
Node **26.x**, npm (в комплекте). Версия зафиксирована в четырёх местах, они
обязаны совпадать: `backend/package.json -> engines`, `frontend/package.json -> engines`, `.github/workflows/ci.yml`, этот файл.

## Порты (контракт, меняется только через PR)
| Порт | Кто      | Что                          |
| ---- | -------- | ---------------------------- |
| 8080 | backend  | сервер, `/health`, `/status` |
| 5173 | frontend | Vite dev-сервер              |

Порт нельзя "временно поправить на месте". Если нужен другой - PR + эта таблица.

## Переменные
Каждая служба читает **свой** `.env`, рядом с её `package.json`.

| Тип  | Переменная | Кто читает | Смысл                  |
| ---- | ---------- | ---------- | ---------------------- |
| BIND | `PORT`     | backend    | на каком порту слушать |
| BIND | `APP_PORT` | frontend   | порт dev-сервера       |

CALL-переменных сейчас нет: запросы относительные (`/health`), маршрут даёт
dev-proxy. Если понадобится прямой вызов на другой origin - сначала к DevOps.

**В контейнере порт задаёт compose через `environment:`, а не `.env`.**

## Быстрый старт
PowerShell / bash:
```powershell
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Дальше - [BACKEND_README.md](BACKEND_README.md).

## Docker
Собирается на ноуте DevOps или VPS сервере.

Запуск:
```bash
cp .env.example .env         # вписать CLOUDPUB_TOKEN
docker compose up -d --build
docker compose ps
docker compose logs backend
docker compose logs tunnel   # публичный URL
```

Остановка:
```bash
docker compose stop   # пауза
docker compose down   # стоп
```
> Не используй `down -v`: сносит тома, состояние агента и публичный URL.

## LAN
Хост сервера пишет свой IP в чат команды.
Доступ с другой машины: `http://<IP>:8080/status`

Фронт тоже доступен по LAN: `http://<IP>:5173` - для совместной
отладки. 

В браузере чужой машины может не хватить HMR-соединения (vite
документирует это в Guide -> Features): если UI "не обновляется сам",
перезагрузка F5 работает всегда, это не баг бэкенда.

Узнать IP: `ipconfig` (Windows) / `hostname -I` (Linux).

Сервер слушает `0.0.0.0`, то есть на всех сетевых интерфейсах машины.
Наружу ничего не публикуется, когда доступен туннель: туннель сам выходит
к провайдеру, входящих портов не требуется.

## Частые проблемы
- `EADDRINUSE` - порт занят: у бэкенда это `PORT` в `backend/.env`,
  у vite - `APP_PORT` в `frontend/.env`. Сменить, перезапустить.
- `.env not found` в логе - предупреждение - сервер поднялся на 8080. Сделай Быстрый старт.
- Страница пустая или `The main page` вместо UI - бэкенд жив, фронта в туннеле нет
- `npm ci` ругается на lock-файл - `package-lock.json` закоммичен, не удалять;
  в CI и в Docker использовать только `npm ci`.

- Если `curl http://127.0.0.1:5173/health` после правки конфига вернул HTML
  или ошибку: цель в `proxy` обязана быть `http://127.0.0.1:8080`, а не
  `http://localhost:8080` - `localhost` резолвится в IPv6 `[::1]`,
  а бэкенд слушает IPv4.