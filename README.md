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

CI/CD через GitHub Actions настроен в `.github/workflows/ci-cd.yml`. Workflow запускается на push в `main` и `devops/container-native-deploy`, а также вручную через `workflow_dispatch`. CI проверяет backend compile, Alembic env syntax, frontend build, shell syntax и whitespace; `npm run lint` не запускается.

Для deploy нужно добавить GitHub Secrets:

```text
DEPLOY_HOST=194.190.136.78
DEPLOY_PORT=2206
DEPLOY_USER=team6
DEPLOY_SSH_KEY=<private ssh key>
DEPLOY_PATH=/home/team6/matryoshka
DEPLOY_BRANCH=devops/container-native-deploy
```

SSH private key хранится только в GitHub Secrets. Лучше использовать отдельный deploy key/user key с доступом только к серверу. `.env.native` создается вручную на сервере в `/home/team6/matryoshka/.env.native` и не хранится в GitHub.

Автоматический deploy после успешного CI подключается к серверу по SSH, выполняет fast-forward pull нужной ветки, готовит backend/frontend окружение, запускает PostgreSQL при необходимости, применяет миграции, перезапускает backend и Caddy, затем проверяет health checks.

Запустить release вручную на сервере:

```bash
ENV_FILE="$PWD/.env.native" DEPLOY_BRANCH=devops/container-native-deploy ./scripts/container-native/release.sh
```

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
ENV_FILE="$PWD/.env.native" ./scripts/container-native/status.sh
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1/api/health
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
