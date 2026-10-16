# Hackathon Skeleton

Веб-приложение для совместного редактирования документа в реальном времени.

Документы по ролям:
- [BACKEND_README.md](BACKEND_README.md) - сервер и контракт `/health`
- [UI_README.md](UI_README.md) - фронт и подключение к бэкенду
- [docs/DEPLOY.md](docs/DEPLOY.md) - запуск на ноутбуке и на VPS

## Структура
```
backend/   Node-сервер: /health, /status, позже Yjs
frontend/  Vite + React
docs/      деплой, решения, аварии
```

## Требования
Node **26.x**, npm (в комплекте). Версия зафиксирована в трёх местах, они
обязаны совпадать: `backend/package.json -> engines`, `.github/workflows/ci.yml`,
этот файл.
А
## Порты (контракт, меняется только через PR)
| Порт | Кто      | Что                          |
| ---- | -------- | ---------------------------- |
| 8080 | backend  | сервер, `/health`, `/status` |
| 5173 | frontend | Vite dev-сервер              |

Порт нельзя "временно поправить на месте". Если нужен другой - PR + эта таблица.

## Переменные
Каждая служба читает **свой** `.env`, рядом с её `package.json`.

| Тип  | Переменная     | Кто читает | Смысл                     |
| ---- | -------------- | ---------- | ------------------------- |
| BIND | `PORT`         | backend    | на каком порту слушать    |
| CALL | `VITE_API_URL` | frontend   | куда обращаться к бэкенду |

BIND = "куда я втыкаю вилку", CALL = "кому я звоню". Пересекаться именами не
должны: у двух BIND-сервисов общая переменная `PORT` даёт конфликт портов.
**В контейнере порт задаёт compose через `environment:`, а не `.env`.**

## Быстрый старт
PowerShell / bash:
```powershell
cp backend/.env.example backend/.env
```
Дальше - [BACKEND_README.md](BACKEND_README.md).

## Docker
Собирается на ноуте DevOps или VPS сервере.

Запуск:
```bash
cp .env.example .env      # вписать CLOUDPUB_TOKEN
docker compose up -d --build
docker compose ps
docker compose logs backend
docker compose logs tunnel   # публичный URL
```

## LAN
Хост сервера пишет свой IP в чат команды.
Доступ с другой машины: `http://<IP>:8080/status`
Узнать IP: `ipconfig` (Windows) / `hostname -I` (Linux).

Сервер слушает `0.0.0.0`, то есть на всех сетевых интерфейсах машины.
Наружу ничего не публикуется, когда доступен туннель: туннель сам выходит
к провайдеру, входящих портов не требуется.

## Частые проблемы
- `EADDRINUSE` - порт занят, смени в `.env`, перезапусти.
- `.env not found` в логе - предупреждение - сервер поднялся на 8080. Сделай Быстрый старт.
- Страница пустая или `ping` вместо UI - бэкенд жив, фронта в туннеле нет
- `npm ci` ругается на lock-файл - `package-lock.json` закоммичен, не удалять;
  в CI и в Docker использовать только `npm ci`.