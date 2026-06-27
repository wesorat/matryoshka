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
PostgreSQL запускается на уровне пользователя через `pg_ctl`, который native scripts находят сами, включая `/usr/lib/postgresql/*/bin`.
PostgreSQL слушает `127.0.0.1:5432`, а локальный socket лежит в `$HOME/matryoshka-runtime/postgres-run`, не в `/var/run/postgresql`.
Runtime-файлы, PostgreSQL data, uploads, logs, pid-файлы и backend venv лежат в `$HOME/matryoshka-runtime`.

Запустить процессы:

```bash
ENV_FILE="$PWD/.env.native" ./scripts/container-native/start-postgres.sh
ENV_FILE="$PWD/.env.native" ./scripts/container-native/migrate.sh
ENV_FILE="$PWD/.env.native" ./scripts/container-native/start-backend.sh
ENV_FILE="$PWD/.env.native" ./scripts/container-native/start-caddy.sh
```

Остановить процессы:

```bash
ENV_FILE="$PWD/.env.native" ./scripts/container-native/stop-caddy.sh
ENV_FILE="$PWD/.env.native" ./scripts/container-native/stop-backend.sh
ENV_FILE="$PWD/.env.native" ./scripts/container-native/stop-postgres.sh
```

Проверить внутри контейнера:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1/
curl http://127.0.0.1/_proxy_health
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
