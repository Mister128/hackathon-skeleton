# Деплой

## Вариант 1: ноутбук (демо на площадке)
Сервер - моя машина, доступ команды - по LAN, наружу - через туннель.

### Подготовка
- [ ] Docker Desktop + WSL2, `docker version` отвечает
- [ ] `docker compose build` прошёл полностью (образы в кэше)
- [ ] `CLOUDPUB_TOKEN` в `.env`, проверен в день выезда
- [ ] сон по крышке и по таймеру выключен; ноут на питании
- [ ] бэкап плана Б: видео демо от @Vireist лежит на флешке и в чате

### Запуск
```bash
cp .env.example .env    # вписать CLOUDPUB_TOKEN
docker compose up -d --build
docker compose ps       # backend (healthy)
docker compose logs backend
docker compose logs tunnel
```
Публичный URL - из `logs tunnel`. Проверить на телефоне **через мобильный
интернет**, не через тот же Wi-Fi.

### LAN-вариант (без интернета)
`ipconfig` → IP; сообщить команде одним сообщением в чат.
Доступ: `http://<IP>:8080/status`

## Вариант 2: VPS
Отличается двумя вещами: добавляется `web` (nginx) и туннель смотрит на него.
Файл: `docker-compose.vps.yml`, запуск с двумя `-f`.

```bash
cp .env.example .env      # CLOUDPUB_TOKEN
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build
docker compose ps
curl -I http://localhost/          # web отвечает
curl http://localhost/health        # nginx проксирует на бэкенд
```

## Куда что кладётся
| Где                          | Что читает                             |
| ---------------------------- | -------------------------------------- |
| `.env` рядом с `compose.yml` | compose, для `${CLOUDPUB_TOKEN}`       |
| `backend/.env`               | Node локально (`--env-file-if-exists`) |
| `frontend/.env`              | Vite (только `VITE_*`)                 |
| `environment:` в compose     | контейнеры (BIND-значения)             |