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

# Для генерации начальных данных в бд
```bash
    psql -h localhost -p 5433 -U postgres -d matr_db -f seed_for_db.sql
```

# Production

Локальная проверка:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
curl http://localhost:8080/
curl http://localhost:8080/api/health
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

`DB_PASSWORD` и `SECRET` обязательны и не имеют production-дефолтов.
PostgreSQL и backend наружу не публикуются.
