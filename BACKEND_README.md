# Backend

## Запуск
```powershell
cd backend
npm ci
npm start
```
Адрес: `http://127.0.0.1:8080`
Порт: `backend/.env` -> `PORT`; если файла нет, сервер молча берёт 8080.
В контейнере порт приходит из compose (`environment: PORT=${BACKEND_PORT}`),
`.env` внутри образа отсутствует намеренно (`.dockerignore`).

Логи запуска в контейнере короче: при `IN_DOCKER=true` сервер не печатает
LAN-адрес - он был бы адресом docker-сети и nobody бы по нему не дошёл.
В CI он не печатается при `CI=true` (ставится Actions автоматически).

## Проверка живости
Отдельный терминал:
```powershell
curl http://127.0.0.1:8080/health
```
Ожидаемый ответ (200, `application/json`):
```json
{"ok":true,"time":"2026-10-15T07:57:18.717Z"}
```
В контейнере / на Linux - та же проверка одной строкой (это же содержимое
`healthcheck` в compose):
```bash
wget -qO- http://127.0.0.1:8080/health
```
Через nginx (прод-маршрут): `curl http://localhost:8081/health`
Страница статуса для людей: `http://127.0.0.1:8080/status`

## Контракт /health - не ломать
CI и healthcheck в compose проверяют ровно и только это:
1. `GET /health` возвращает HTTP **200**
2. `Content-Type: application/json`
3. тело содержит `"ok":true`

**При переносе логики на Yjs сохрани этот эндпоинт в той же форме.**
Иначе CI красный после твоего мержа, и разбираться будет тот, кто мержил,
не DevOps.

## /status
Отдаётся тем же процессом, файл лежит в `backend/pages/`.
**Не переносить в React:** он должен открываться, даже когда фронт собран
криво или лежит. Это точка опоры при диагностике. В проде он доступен и через
nginx (`location ~ ^/(health|status)$`), по адресу, который получают жюри.

## Прочее поведение
`GET /` -> текст `The main page`. `GET` на другой путь -> текст `ping`. Это не
ошибка и не страница: индикатор, что процесс жив, но эндпоинта нет.

- 404 появится, когда техлид сделает маршруты - тогда добавим проверку в CI.

## Логи и диагностика
```bash
docker compose logs backend    # строчка "server on ... :<порт>" = env прочитался
docker compose ps              # backend должен быть (healthy)
cat backend/server.log         # локально, если запускал с перенаправлением
```
Если в логе `:<пусто>` или порт не тот, что в `.env`/compose - переменная не
дошла (частая причина: `BACKEND_PORT` не определена, compose подставляет пустоту).
`server.log` не коммитится (`.gitignore` / `.dockerignore`).

## CI
Файл: `.github/workflows/ci.yml`, job `backend`:
`npm ci` -> запуск в фоне (`npm start > server.log 2>&1 &`) -> `sleep 5s` ->
**три отдельные команды** для `http://127.0.0.1:$PORT/health`:
1. тело: `curl -sS "$SITE" | grep -q '"ok":true'`
2. заголовок: `curl -sS -D - -o /dev/null "$SITE" | grep -qi 'content-type: *application/json'`
3. код: `code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE")`, при != 200 печатает
   `health returned <код>` и падает

-> `kill $SERVER_PID`. При падении шаг `if: failure()` печатает `backend/server.log`.

Два нюанса, которые легко «сломать обратно»:
- проверки - отдельные команды, не `&&`: в `bash -e` провал внутри `&&` step
  не валит, и step останется зелёным вруном;
- `-o /dev/null` с `-i` тоже съедает заголовки, поэтому `-D -`.

`PORT` задаётся на уровне job (не workflow) - иначе он утекает в job `frontend`.

Локально тот же смысл: `npm ci`, `npm start`, `curl`, `wget`.