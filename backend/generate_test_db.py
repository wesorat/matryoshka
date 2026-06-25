import requests
import random
import time
from faker import Faker
from typing import List, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import io
import os

# Инициализация Faker для генерации данных
fake = Faker()

# Базовый URL API
BASE_URL = "http://localhost:8000"  # Измените на ваш URL

# Список категорий
CATEGORIES = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain",
    "IoT (Internet of Things)",
    "Game Development",
    "UI/UX Design",
    "Artificial Intelligence",
    "Big Data",
    "Software Architecture",
    "Testing/QA",
    "Project Management",
    "Agile/Scrum",
    "Python Programming",
    "JavaScript/TypeScript",
    "Go/Rust Programming",
]

# Статусы проектов
PROJECT_STATUSES = ["draft", "published"]


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
        # Создаем папку для временных изображений
        self.temp_dir = "temp_images"
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir)

    def create_category(self, name: str) -> Dict[str, Any]:
        """Создание категории"""
        url = f"{self.base_url}/category/"
        payload = {"name": name}
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
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
        print(f"Created {len(self.categories)} categories")

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
        email = f"{first_name.lower()}.{last_name.lower()}@example.com"
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
    ) -> Dict[str, Any]:
        """Создание проекта с изображением"""
        url = f"{self.base_url}/projects/"

        # Генерируем изображение
        image_bytes = self.generate_project_image(title)

        # Параметры запроса (query parameters)
        params = {}

        # Добавляем параметры
        params["title"] = title
        if description:
            params["description"] = description
        if category_id:
            params["category_id"] = category_id
        if status:
            params["status"] = status

        # Файл для загрузки
        files = {"file": (f"{title[:30]}.png", image_bytes, "image/png")}

        # Используем куки пользователя
        try:
            response = requests.post(
                url,
                params=params,  # Query parameters
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
            # Генерация данных проекта
            title = fake.sentence(nb_words=3)[:-1] + f" - {i+1}"
            description = fake.text(max_nb_chars=200)

            # Выбираем случайную категорию
            category = random.choice(self.categories) if self.categories else None
            category_id = category["id"] if category else None

            # Статус: 80% published, 20% draft
            status = random.choices(["published", "draft"], weights=[0.8, 0.2], k=1)[0]

            # Создаем проект с изображением
            project = self.create_project_with_image(
                user_info, title, description, category_id, status
            )

            if project:
                self.projects.append(project)
                print(
                    f"  Created project: {project['title']} (status: {project['status']}, has image: {bool(project.get('image_url'))})"
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
                p for p in self.projects if p.get("owner_id") == user_info["id"]
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
    # Создаем экземпляр генератора
    generator = TestDataGenerator(BASE_URL)

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
