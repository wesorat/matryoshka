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
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
curl http://localhost:8080/
curl http://localhost:8080/api/health
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

`DB_PASSWORD` и `SECRET` обязательны.
PostgreSQL и backend наружу не публикуются.

# Для DevOps

В контейнерной среде HTTPS уже завершается внешним proxy. Внутренний native Caddy слушает только `:80`; сертификаты внутри контейнера не выпускаются.

Native deploy для контейнерной среды:

```bash
cp .env.native.example .env.native
# заполнить DB_PASSWORD и SECRET
./scripts/container-native/deploy.sh
```

Frontend для native container mode собирается с `VITE_API_URL=/api`, поэтому API идет через внутренний Caddy на `127.0.0.1:8000`.
PostgreSQL должен быть доступен внутри контейнера на `127.0.0.1:5432`.

Запустить процессы:

```bash
ENV_FILE="$PWD/.env.native" ./scripts/container-native/start-backend.sh
ENV_FILE="$PWD/.env.native" ./scripts/container-native/start-caddy.sh
```

Проверить внутри контейнера:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1/
```

Проверить снаружи:

```bash
curl https://matryoshka.st.ifbest.org/api/health
```

Первичная подготовка VDS:

```bash
./scripts/server-bootstrap.sh
```

Запуск деплоя:

```bash
cd /opt/matryoshka
./scripts/deploy.sh
```

Проверить:

```bash
curl https://matryoshka.st.ifbest.org/api/health
```
