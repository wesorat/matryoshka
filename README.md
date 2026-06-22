# Для запуска
```bash
    docker-compose up --build -d
```
# Для применения миграций
```bash
    docker exec -it matryoshka_backend alembic upgrade head
```
# Для дозаполнения бд, мне оч надо
```bash
    docker exec -it matryoshka_backend python seed_categories.py    
```