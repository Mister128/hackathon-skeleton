# Hackathon Skeleton

Веб-приложение для совместного редактирования документа в реальном времени.

Дальше по ролям:
- [BACKEND_README.md](BACKEND_README.md) - сервер, контракт /health
- [UI_README.md](UI_README.md) - фронт, подключение к бэкенду

## Структура
backend/    - Node-сервер (Yjs / API)
frontend/   - Vite + React (фронт)
docs/       - заметки по деплою и решениям

## Что нужно
Node 26.x, npm (в комплекте с Node). Версия зафиксирована в
backend/package.json -> engines. Та же версия ставится в CI.

## Порты (контракт, менять только через PR)
| Порт | Кто      | Зачем                      |
| ---- | -------- | -------------------------- |
| 8080 | backend  | сервер + /health + /status |
| 5173 | frontend | Vite dev-сервер            |

## Переменные
Каждая служба читает свой .env.

| Тип  | Переменная   | Кто читает | Смысл                     |
| ---- | ------------ | ---------- | ------------------------- |
| BIND | PORT         | backend    | на каком порту слушать    |
| CALL | VITE_API_URL | frontend   | куда обращаться к бэкенду |

BIND = «куда втыкаю вилку». CALL = «кому я звоню».
Пересеаться по именам они не должны.

## Быстрый старт
Для сервера есть .env.example. Откопируй .env.example в .env
```powershell
cp backend/.env.example backend/.env
```

Запуск - см. [BACKEND_README](./BACKEND_README.md) и [UI_README](./UI_README.md)

## Частые проблемы
- `EADDRINUSE` - порт занят, смени в .env и перезапусти.
- `.env not found` - warning, НЕ ошибка. Сервер
поднялся на 8080. Сделай Быстрый старт, если нужен свой порт.
- `npm ci` ругается на package-lock.json - lock закоммичен в репо,
не удаляй его и не запускай `npm install` в CI. Обратиться DevOps
