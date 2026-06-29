import os
import sys

ALLOW_DEMO_SEED_ENV = "ALLOW_DEMO_SEED"


def ensure_demo_seed_allowed():
    if os.environ.get(ALLOW_DEMO_SEED_ENV) != "1":
        print(
            "Refusing to run demo seed. This script creates users, projects, "
            "uploads, comments and likes through the configured API.\n"
            f"Run intentionally with `{ALLOW_DEMO_SEED_ENV}=1 python generate_test_db.py` "
            "against a local/demo backend only."
        )
        sys.exit(1)


if __name__ == "__main__":
    ensure_demo_seed_allowed()


import requests
import random
import time
from faker import Faker
from typing import List, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import io

# Инициализация Faker для генерации данных
fake = Faker()

# Базовый URL API
BASE_URL = os.environ.get("DEMO_SEED_BASE_URL", "http://localhost:8000").rstrip("/")

PROJECT_DETAIL_FIELDS = {
    "practical_benefit",
    "implementation_details",
    "results",
}

# Список категорий
CATEGORIES = [
    "Аналитика, безопасность и SEO",
    "DevOps и мониторинг",
    "Документация и генерация текстов",
    "Коммуникации и мессенджеры",
    "Музыка и стриминг",
    "No-code конструкторы",
    "Образование и управление практикой",
    "Редакторы мультимедиа",
    "Социальные сети и знакомства",
    "Управление персоналом и компетенциями",
    "Управление проектами и баг-трекинг",
    "Фриланс и биржи",
]

# Статусы проектов
PROJECT_STATUSES = ["draft", "published"]

PROJECT_DETAIL_TEMPLATES = [
    {
        "practical_benefit": (
            "Проект помогает команде быстрее проверять гипотезы и показывает "
            "понятный результат для пользователей."
        ),
        "implementation_details": (
            "Реализация включает backend API, пользовательский интерфейс и "
            "простую схему хранения данных для демонстрационного сценария."
        ),
        "results": (
            "Получен рабочий прототип с заполненной витриной, карточками, "
            "изображениями и публичным просмотром проекта."
        ),
    },
    {
        "practical_benefit": (
            "Решение снижает ручную работу и делает процесс публикации проекта "
            "более прозрачным для участников."
        ),
        "implementation_details": (
            "В проекте используются формы публикации, категории, статусы и "
            "загрузка preview-изображения через существующий API."
        ),
        "results": (
            "Демо-данные позволяют проверить главную страницу, страницы категорий "
            "и детальную карточку без ручного наполнения базы."
        ),
    },
    {
        "practical_benefit": (
            "Проект показывает прикладную ценность идеи и помогает сравнивать "
            "несколько работ в общей витрине."
        ),
        "implementation_details": (
            "Основной поток строится вокруг владельца проекта, категории, "
            "описания, статуса публикации и медиа-превью."
        ),
        "results": (
            "После публикации проект появляется в списках, участвует в сортировке "
            "по лайкам и открывается на детальной странице."
        ),
    },
]


class TestDataGenerator:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.users = []
        self.categories = []
        self.projects = []
        self.comments = []
        self.likes = []
        self.cookies = {}
        self.project_sequence = 0
        self.project_detail_fields_supported = True
        # Создаем папку для временных изображений
        self.temp_dir = "temp_images"
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir)

    def detect_project_detail_field_support(self) -> bool:
        """Проверяет, принимает ли текущий API detail-поля проекта в form schema."""
        try:
            response = self.session.get(f"{self.base_url}/openapi.json", timeout=5)
            response.raise_for_status()
            openapi = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Could not inspect OpenAPI schema, assuming detail fields are supported: {e}")
            return True

        schemas = openapi.get("components", {}).get("schemas", {})
        for schema in schemas.values():
            properties = set(schema.get("properties", {}).keys())
            if PROJECT_DETAIL_FIELDS.issubset(properties):
                print("Project detail fields are supported by current API schema")
                return True

        print(
            "Project detail fields are not present in current API schema; "
            "they will be skipped"
        )
        return False

    def fetch_categories(self) -> List[Dict[str, Any]]:
        """Получение существующих категорий из API."""
        url = f"{self.base_url}/category/"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            categories = response.json()
            return categories if isinstance(categories, list) else []
        except requests.exceptions.RequestException as e:
            print(f"Error fetching existing categories: {e}")
            return []

    def create_category(self, name: str) -> Dict[str, Any]:
        """Создание категории"""
        url = f"{self.base_url}/category/"
        payload = {"name": name}
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            response = getattr(e, "response", None)
            if response is not None and response.status_code == 409:
                print(f"  Category already exists: {name}")
                return None
            print(f"Error creating category {name}: {e}")
            return None

    def create_all_categories(self):
        """Создание всех категорий"""
        print("Creating categories...")
        for category_name in CATEGORIES:
            category = self.create_category(category_name)
            if category:
                self.categories.append(category)
                print(f"  Created category: {category['name']}")

        existing_categories = self.fetch_categories()
        known_names = set(CATEGORIES)
        usable_categories = [
            category
            for category in existing_categories
            if category.get("name") in known_names
        ]

        if not usable_categories:
            usable_categories = existing_categories

        by_id = {}
        for category in self.categories + usable_categories:
            category_id = category.get("id")
            if category_id is not None:
                by_id[category_id] = category

        self.categories = list(by_id.values())
        print(f"Categories available for projects: {len(self.categories)}")

    def register_user(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """Регистрация пользователя"""
        url = f"{self.base_url}/auth/register"
        payload = {
            "email": email,
            "password": password,
            "name": name,
            "is_active": True,
            "is_superuser": False,
            "is_verified": True,
        }
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error registering user {email}: {e}")
            return None

    def login_user(self, email: str, password: str) -> bool:
        """Вход пользователя и получение токена"""
        url = f"{self.base_url}/auth/jwt/login"
        data = {"username": email, "password": password}
        try:
            response = requests.post(url, data=data)
            response.raise_for_status()

            # Сохраняем куки
            if "access" in response.cookies:
                self.cookies = response.cookies.get_dict()
                return True
            return False
        except requests.exceptions.RequestException as e:
            print(f"Error logging in user {email}: {e}")
            return False

    def create_user(self) -> Dict[str, Any]:
        """Создание пользователя с регистрацией и входом"""
        # Генерируем данные пользователя
        first_name = fake.first_name()
        last_name = fake.last_name()
        name = f"{first_name} {last_name}"
        email_suffix = f"{int(time.time())}.{random.randint(1000, 9999)}"
        first_email_part = "".join(
            ch for ch in first_name.lower() if ch.isascii() and ch.isalnum()
        ) or "user"
        last_email_part = "".join(
            ch for ch in last_name.lower() if ch.isascii() and ch.isalnum()
        ) or "demo"
        email = f"demo.{first_email_part}.{last_email_part}.{email_suffix}@example.com"
        password = "TestPassword123!"

        # Регистрируем пользователя
        user = self.register_user(email, password, name)
        if not user:
            return None

        # Входим в систему
        if not self.login_user(email, password):
            return None

        # Сохраняем данные для использования в проектах
        user_info = {
            "id": user["id"],
            "email": email,
            "password": password,
            "name": name,
            "cookies": self.cookies.copy(),
        }
        return user_info

    def generate_project_image(
        self, title: str, width: int = 800, height: int = 400
    ) -> bytes:
        """Генерация изображения для проекта с текстом по центру"""
        # Создаем белое изображение
        image = Image.new("RGB", (width, height), color="white")
        draw = ImageDraw.Draw(image)

        # Пытаемся загрузить шрифт, если не получается - используем стандартный
        font_size = min(width, height) // 12

        try:
            # Пробуем загрузить системный шрифт
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVu-Sans.ttf", font_size
            )
        except:
            try:
                # Для Windows
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                # Если шрифт не найден, используем стандартный
                font = ImageFont.load_default()
                font_size = min(width, height) // 15

        # Разбиваем длинный заголовок на строки
        max_chars_per_line = width // (font_size // 2)
        lines = []
        current_line = []

        for word in title.split():
            if len(" ".join(current_line + [word])) <= max_chars_per_line:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            lines.append(" ".join(current_line))

        # Если строк слишком много, обрезаем
        if len(lines) > 3:
            lines = lines[:3]
            lines[-1] += "..."

        # Вычисляем общую высоту текста
        total_text_height = len(lines) * font_size + (len(lines) - 1) * (font_size // 4)
        y_position = (height - total_text_height) // 2

        # Рисуем текст построчно
        for line in lines:
            # Получаем размеры текста
            try:
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            except:
                text_width = len(line) * (font_size // 2)
                text_height = font_size

            x_position = (width - text_width) // 2
            draw.text((x_position, y_position), line, fill="black", font=font)
            y_position += text_height + font_size // 4

        # Сохраняем изображение в байты
        img_bytes = io.BytesIO()
        image.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        return img_bytes.getvalue()

    def create_project_with_image(
        self,
        user_info: Dict[str, Any],
        title: str,
        description: str,
        category_id: int = None,
        status: str = "draft",
        detail_fields: Dict[str, str] = None,
    ) -> Dict[str, Any]:
        """Создание проекта с изображением"""
        url = f"{self.base_url}/projects/"

        # Генерируем изображение
        image_bytes = self.generate_project_image(title)

        # Данные для multipart/form-data
        data = {
            "title": title,
            "description": description,
            "status": status,
        }
        if category_id:
            data["category_id"] = str(category_id)
        if self.project_detail_fields_supported and detail_fields:
            data.update(detail_fields)

        # Файл для загрузки
        files = {}
        if image_bytes:
            files["file"] = (f"{title[:30]}.png", image_bytes, "image/png")

        # Используем куки пользователя
        try:
            response = requests.post(
                url,
                data=data,  # Form data
                files=files,  # File upload
                cookies=user_info.get("cookies", {}),
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error creating project {title}: {e}")
            if hasattr(e, "response") and e.response:
                print(f"Status code: {e.response.status_code}")
                print(f"Response: {e.response.text}")
            return None

    def generate_project_details(
        self, title: str, category: Dict[str, Any] = None
    ) -> Dict[str, str]:
        """Генерация текстов, которые реально отображаются на детальной странице."""
        template = random.choice(PROJECT_DETAIL_TEMPLATES).copy()
        category_name = category.get("name") if category else "общей категории"
        template["practical_benefit"] = (
            f"{template['practical_benefit']} Направление: {category_name}."
        )
        template["implementation_details"] = (
            f"{template['implementation_details']} Демонстрационный проект: {title}."
        )
        return template

    def create_comment(
        self, user_info: Dict[str, Any], project_id: int, text: str
    ) -> Dict[str, Any]:
        """Создание комментария к проекту"""
        url = f"{self.base_url}/comments/"
        payload = {"text": text, "project_id": project_id}

        try:
            response = requests.post(
                url, json=payload, cookies=user_info.get("cookies", {})
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error creating comment: {e}")
            if hasattr(e, "response") and e.response:
                print(f"Status code: {e.response.status_code}")
                print(f"Response: {e.response.text}")
            return None

    def create_like(self, user_info: Dict[str, Any], project_id: int) -> bool:
        """Создание лайка для проекта"""
        url = f"{self.base_url}/likes/"
        params = {"project_id": project_id}

        try:
            response = requests.post(
                url, params=params, cookies=user_info.get("cookies", {})
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error creating like: {e}")
            if hasattr(e, "response") and e.response:
                print(f"Status code: {e.response.status_code}")
                print(f"Response: {e.response.text}")
            return False

    def generate_comments_for_project(self, project: Dict[str, Any], num_comments: int):
        """Генерация комментариев для проекта"""
        print(f"  Generating {num_comments} comments for project: {project['title']}")

        # Выбираем случайных пользователей для комментирования
        available_users = [u for u in self.users if u["id"] != project.get("owner_id")]
        if not available_users:
            print("    No other users available for commenting")
            return

        for i in range(num_comments):
            # Выбираем случайного пользователя
            user = random.choice(available_users)

            # Генерируем текст комментария
            comment_texts = [
                fake.sentence(nb_words=10),
                fake.paragraph(nb_sentences=2),
                f"Great project! {fake.sentence(nb_words=5)}",
                f"Interesting work! {fake.sentence(nb_words=6)}",
                f"Nice! {fake.sentence(nb_words=4)}",
                fake.sentence(nb_words=8),
                f"I like this project because {fake.sentence(nb_words=7)}",
                f"Good job! {fake.sentence(nb_words=5)}",
                fake.paragraph(nb_sentences=1),
                f"Looking forward to seeing more! {fake.sentence(nb_words=4)}",
            ]
            text = random.choice(comment_texts)

            # Создаем комментарий
            comment = self.create_comment(user, project["id"], text)
            if comment:
                self.comments.append(comment)
                print(f"    Created comment by {user['name']}: {text[:50]}...")

            # Небольшая задержка
            time.sleep(0.1)

    def generate_likes_for_project(self, project: Dict[str, Any], num_likes: int):
        """Генерация лайков для проекта"""
        print(f"  Generating {num_likes} likes for project: {project['title']}")

        # Выбираем случайных пользователей для лайков
        available_users = [u for u in self.users if u["id"] != project.get("owner_id")]
        if not available_users:
            print("    No other users available for likes")
            return

        # Выбираем уникальных пользователей для лайков
        num_likes = min(num_likes, len(available_users))
        selected_users = random.sample(available_users, num_likes)

        for user in selected_users:
            # Создаем лайк
            if self.create_like(user, project["id"]):
                self.likes.append({"user_id": user["id"], "project_id": project["id"]})
                print(f"    Created like by {user['name']}")

            # Небольшая задержка
            time.sleep(0.1)

    def generate_project_data(self, user_info: Dict[str, Any], num_projects: int = 10):
        """Генерация проектов для пользователя с комментариями и лайками"""
        print(f"\nGenerating projects for user: {user_info['name']}")

        for i in range(num_projects):
            sequence = self.project_sequence
            self.project_sequence += 1

            # Генерация данных проекта
            title = fake.sentence(nb_words=3)[:-1] + f" - {i+1}"
            description = fake.text(max_nb_chars=200)

            # Выбираем случайную категорию
            category = (
                self.categories[sequence % len(self.categories)]
                if self.categories
                else None
            )
            category_id = category["id"] if category else None

            # Статус: 80% published, 20% draft. Последовательное распределение
            # гарантирует опубликованные проекты в разных категориях.
            status = "draft" if sequence % 5 == 4 else "published"
            detail_fields = self.generate_project_details(title, category)

            # Создаем проект с изображением
            project = self.create_project_with_image(
                user_info, title, description, category_id, status, detail_fields
            )

            if project:
                self.projects.append(project)
                category_data = project.get("category") or {}
                print(
                    f"  Created project: {project['title']} "
                    f"(status: {project['status']}, category_id: {category_data.get('id')}, "
                    f"has image: {bool(project.get('image_url'))})"
                )
                if project.get("image_url"):
                    print(f"    Image URL: {project['image_url']}")

                # Добавляем комментарии и лайки только для опубликованных проектов
                if project["status"] == "published" and len(self.users) > 1:
                    # Количество комментариев: от 0 до 5
                    num_comments = random.randint(0, 5)
                    if num_comments > 0:
                        self.generate_comments_for_project(project, num_comments)

                    # Количество лайков: от 0 до 3
                    num_likes = random.randint(0, 3)
                    if num_likes > 0:
                        self.generate_likes_for_project(project, num_likes)
                else:
                    if project["status"] != "published":
                        print(f"    Skipping comments/likes for draft project")
                    elif len(self.users) <= 1:
                        print(f"    Not enough users for comments/likes")
            else:
                print(f"  Failed to create project: {title}")

            # Небольшая задержка для избежания перегрузки API
            time.sleep(0.1)

    def generate_all_data(self, num_users: int = 5, projects_per_user: int = 10):
        """Генерация всех тестовых данных"""
        print("=" * 50)
        print("Starting test data generation")
        print("=" * 50)

        # Создаем категории
        self.create_all_categories()
        if not self.categories:
            print("No categories available. Projects would not populate the storefront.")
            return

        # Создаем пользователей
        print("\nCreating users...")
        for i in range(num_users):
            user_info = self.create_user()
            if user_info:
                self.users.append(user_info)
                print(
                    f"  Created user: {user_info['name']} (email: {user_info['email']})"
                )
            else:
                print(f"  Failed to create user {i+1}")

            # Небольшая задержка между пользователями
            time.sleep(0.5)

        # Создаем проекты для каждого пользователя
        print(f"\nCreating projects for {len(self.users)} users...")
        for user_info in self.users:
            self.generate_project_data(user_info, projects_per_user)

        # Выводим статистику
        print("\n" + "=" * 50)
        print("DATA GENERATION COMPLETED")
        print("=" * 50)
        print(f"Categories: {len(self.categories)}")
        print(f"Users: {len(self.users)}")
        print(f"Projects: {len(self.projects)}")
        print(f"Comments: {len(self.comments)}")
        print(f"Likes: {len(self.likes)}")

        # Статистика по статусам проектов
        if self.projects:
            published = sum(1 for p in self.projects if p.get("status") == "published")
            draft = len(self.projects) - published
            print(
                f"Projects published: {published} ({published/len(self.projects)*100:.1f}%)"
            )
            print(f"Projects draft: {draft} ({draft/len(self.projects)*100:.1f}%)")

            # Статистика по изображениям
            has_image = sum(1 for p in self.projects if p.get("image_url"))
            print(
                f"Projects with image: {has_image} ({has_image/len(self.projects)*100:.1f}%)"
            )

        # Выводим примеры пользователей и их проектов
        print("\n" + "=" * 50)
        print("Sample data:")
        print("=" * 50)
        for user_info in self.users[:3]:  # Показываем первых 3 пользователей
            user_projects = [
                p for p in self.projects if p.get("owner", {}).get("id") == user_info["id"]
            ]
            print(f"\nUser: {user_info['name']} (ID: {user_info['id']})")
            print(f"  Email: {user_info['email']}")
            print(f"  Projects: {len(user_projects)}")

            # Показываем комментарии и лайки для проектов
            for project in user_projects[:3]:  # Показываем первые 3 проекта
                image_status = "✅" if project.get("image_url") else "❌"
                print(
                    f"    {image_status} {project['title']} ({project.get('status', 'unknown')})"
                )

                # Считаем комментарии и лайки для этого проекта
                project_comments = [
                    c for c in self.comments if c.get("project_id") == project["id"]
                ]
                project_likes = [
                    l for l in self.likes if l.get("project_id") == project["id"]
                ]

                if project_comments:
                    print(f"       Comments: {len(project_comments)}")
                    for comment in project_comments[
                        :2
                    ]:  # Показываем первые 2 комментария
                        print(f"         - {comment.get('text', '')[:50]}...")
                if project_likes:
                    print(f"       Likes: {len(project_likes)}")

                if project.get("image_url"):
                    print(f"       Image: {project['image_url']}")

            if len(user_projects) > 3:
                print(f"    ... and {len(user_projects) - 3} more projects")


def main():
    ensure_demo_seed_allowed()

    # Создаем экземпляр генератора
    generator = TestDataGenerator(BASE_URL)
    print(f"Demo seed target API: {BASE_URL}")

    # Проверяем доступность API
    try:
        response = requests.get(f"{BASE_URL}/category/")
        if response.status_code != 200:
            print(
                f"Warning: API might not be available (status code: {response.status_code})"
            )
            print("Make sure the server is running and the BASE_URL is correct.")
            return
    except requests.exceptions.RequestException:
        print(f"Error: Could not connect to API at {BASE_URL}")
        print("Make sure the server is running and the BASE_URL is correct.")
        return

    generator.project_detail_fields_supported = (
        generator.detect_project_detail_field_support()
    )

    try:
        # Генерируем тестовые данные
        generator.generate_all_data(num_users=5, projects_per_user=10)
    except KeyboardInterrupt:
        print("\n\nData generation interrupted by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
