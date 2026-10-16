# Frontend

Vite + TypeScript + React

## Запуск
```powershell
cd frontend
npm ci
npm run dev
```
Адрес: `http://localhost:5173`

Порт можно переопределить: `APP_PORT` в `frontend/.env`. Пригодится, если
5173 уже занят другим vite на этой же машине (тогда будет EADDRINUSE).

## Как фронт ходит на бэкенд
Запросы идут через dev-proxy Vite: браузер обращается к `:5173`, Vite
пересылает на `:8080`.

Проверить глазами: DevTools ->  Network ->  запрос должен уходить на
`:5173/...`, а не на `:8080/...`.

## Контракт сборки (не ломать без предупреждения)
CI не знает, что у вас Vite. Он знает два факта::
1. `npm run build` завершается с кодом **0** при успехе
2. результат сборки лежит в **`frontend/dist`**

- Если смените выходную папку (`build.outDir` в конфиге Vite) - предупредите
  DevOps и обновите `path` в `actions/upload-artifact`.
  Иначе CI упадёт с "No files were found with the provided path".
  Это не баг CI: он защищает деплой от пустой сборки.
- `dist/` и `node_modules/` в git не коммитятся. Локальный `npm run build`
  полезен тем, что это тот же тест, что прогоняет CI.
- Контракт бэкенда: `/health` (`{"ok":true,...}`). Для диагностики
  есть `http://<IP>:8080/status` - она работает без фронта.

## Переменные
Всё, что в `VITE_`, видно браузеру. Секретов здесь не бывает и не должно быть.

## Документация (первоисточники)
- Vite -> Config ->  [Server Options](https://vite.dev/config/server-options) - `server.proxy`, `host`
- Vite -> Guide ->  [Env Variables and Modes](https://vite.dev/guide/env-and-mode#env-variables-and-modes) - правило `VITE_`, `.env.local`,
  mode-файлы, и `loadEnv` для чтения env внутри vite.config
- Vite ->  Guide ->  [Features](https://vite.dev/guide/features) - HMR, что ломается при доступе по IP/через tunnel