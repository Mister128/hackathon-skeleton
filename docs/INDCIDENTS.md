# Что запущено
docker compose ps

# Посмотреть логи
docker compose logs --tail=100 backend
docker compose logs --tail=100 web
docker compose logs --tail=100 tunnel

# Проверить backend
curl.exe -fS http://localhost:8081/health

# Перезапустить backend
docker compose restart backend

# Пересобрать и обновить приложения
docker compose up -d --build backend web

# Повторно проверить состояние
docker compose ps