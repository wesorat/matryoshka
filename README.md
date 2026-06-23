# Для запуска
```bash
    docker-compose up --build -d
```
# Для применения миграций
```bash
    docker exec -it matryoshka_backend alembic upgrade head
```
# Для дозаполнения бд
```bash
    docker exec -it matryoshka_backend python generate_test_db.py
```

# Production

Локальная проверка:

```bash
docker compose -f docker-compose.prod.yml up --build -d
curl http://localhost:8080/
curl http://localhost:8080/api/health
docker compose -f docker-compose.prod.yml down
```

PostgreSQL и backend наружу не публикуются. Для HTTPS используйте
`frontend/Caddyfile.https.example` после настройки домена и DNS.
