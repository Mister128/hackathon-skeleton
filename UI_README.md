<!-- UI_README.md -->
# Frontend

Vite + TypeScript + React.

## Запуск
```powershell
cd frontend
npm ci
npm run dev
```
Адрес: `http://localhost:5173`

Порт можно переопределить: `APP_PORT` в `frontend/.env`. Пригодится, если 5173
уже занят другим vite на этой же машине (иначе `EADDRINUSE`).
`APP_PORT` имеет смысл **только** для локального `npm run dev`: в docker фронт -
это nginx (80 внутри контейнера, 8081 с хоста), vite там не запускается и
`APP_PORT` не читается.

**Проверь чтобы правки `vite.config.ts` применялись. Если сервер не перезапускается автоматически, перезапусти сам. `npm run dev`**

## Как фронт ходит на бэкенд
В dev запросы идут через dev-proxy Vite: браузер обращается к `:5173`, vite
пересылает на `:8080`.

Проверить глазами: DevTools -> Network -> запрос должен уходить на `:5173/...`,
а не на `:8080/...`. Быстрая проверка без браузера:
```powershell
curl http://127.0.0.1:5173/health     # ждём JSON, не HTML
```
Если вернул HTML или ошибку: цель в `proxy` обязана быть `http://127.0.0.1:8080`,
а не `http://localhost:8080` - `localhost` резолвится в IPv6 `[::1]`, а бэкенд
слушает IPv4.

В проде dev-proxy не работает: маршрут делает nginx
(`location ~ ^/(health|status)$` в `frontend/nginx.conf`), там же и проверка.

## Контракт сборки (не ломать без предупреждения)
CI не знает, что у вас Vite. Он знает два факта:
1. `npm run build` завершается с кодом **0** при успехе
2. результат сборки лежит в **`frontend/dist`**

- Если смените выходную папку (`build.outDir` в конфиге Vite) - предупредите
  DevOps и обновите `path` в `actions/upload-artifact`. Иначе CI упадёт с
  «No files were found with the provided path». Это не баг CI: он защищает
  деплой от пустой сборки.
- `dist/` и `node_modules/` в git не коммитятся. Локальный `npm run build`
  полезен тем, что это тот же тест, что прогоняет CI (там же и `tsc`).
- **Запросы в коде - относительные**: `fetch('/health')`. Абсолютный адрес
  бэкенда в собранном бандле ловит CI-гард (`http://localhost:8080` /
  `http://127.0.0.1:8080`) - красный job `frontend` на этом шаге значит «код
  уехал с dev-proxy», а не «CI глючит».
- Контракт бэкенда: `/health` (`{"ok":true,...}`), 200, `application/json`.
  Для диагностики есть `http://<IP>:8080/status` - она работает без фронта.
- `package-lock.json` обязан быть в git и быть актуальным: `npm ci` жёстко
  сверяет его с `package.json` (в CI, в Docker и у вас локально).

## Переменные
Файл: `frontend/.env`, в код попадают только переменные с префиксом `VITE_`.
Всё, что в `VITE_`, видно браузеру: секреты здесь невозможны и не нужны.

Сейчас `VITE_*` не нужны вообще: запросы относительные, адрес даёт dev-proxy.
Если появится `VITE_API_URL` с абсолютным адресом - сначала к DevOps: это смена
архитектуры origin, и CI-гард значение из `.env` не проверяет.

## Документация (первоисточники)
- Vite -> Config -> [Server Options](https://vite.dev/config/server-options) - `server.proxy`, `host`, `allowedHosts`
- Vite -> Guide -> [Env Variables and Modes](https://vite.dev/guide/env-and-mode#env-variables-and-modes) - правило `VITE_`, `.env.local`, mode-файлы, `loadEnv` внутри vite.config
- Vite -> Guide -> [Features](https://vite.dev/guide/features) - HMR, что ломается при доступе по IP/через tunnel