import requests
import random
import time
from functools import lru_cache
from faker import Faker
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont
import io
import os
import subprocess
import sys

# Инициализация Faker для генерации данных на русском языке
fake = Faker('ru_RU')

def env_int(name: str, default: int, minimum: int = 0) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        parsed = int(value)
    except ValueError:
        print(f"{name} должен быть целым числом, получено: {value!r}")
        sys.exit(2)
    if parsed < minimum:
        print(f"{name} должен быть >= {minimum}, получено: {parsed}")
        sys.exit(2)
    return parsed


# Базовый URL API. На сервере используйте http://127.0.0.1:8000.
BASE_URL = os.getenv("DEMO_SEED_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
DEMO_SEED_USERS = env_int("DEMO_SEED_USERS", 3, minimum=1)
DEMO_SEED_PROJECTS_PER_USER = env_int("DEMO_SEED_PROJECTS_PER_USER", 4, minimum=0)
DEMO_SEED_MAX_COMMENTS_PER_PROJECT = env_int(
    "DEMO_SEED_MAX_COMMENTS_PER_PROJECT", 3, minimum=0
)
DEMO_SEED_MAX_LIKES_PER_PROJECT = env_int(
    "DEMO_SEED_MAX_LIKES_PER_PROJECT", 2, minimum=0
)
DEMO_SEED_EMAIL_DOMAIN = os.getenv("DEMO_SEED_EMAIL_DOMAIN", "example.com")
DEMO_SEED_USER_PREFIX = os.getenv("DEMO_SEED_USER_PREFIX", "demo")
DEMO_SEED_PASSWORD = os.getenv("DEMO_SEED_PASSWORD", "TestPassword123!")
DEMO_SEED_FONT_PATH = os.getenv("DEMO_SEED_FONT_PATH")

CYRILLIC_FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/times.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]

_FONT_WARNING_PRINTED = False

# Список университетов
UNIVERSITIES = [
    "Московский государственный университет им. М.В. Ломоносова",
    "Санкт-Петербургский государственный университет",
    "Новосибирский государственный университет",
    "Томский государственный университет",
    "Казанский федеральный университет",
    "Уральский федеральный университет",
    "Сибирский федеральный университет",
    "Дальневосточный федеральный университет",
    "Южный федеральный университет",
    "Самарский национальный исследовательский университет",
    "Национальный исследовательский университет ИТМО",
    "Московский физико-технический институт",
    "Национальный исследовательский университет «Высшая школа экономики»",
    "Московский государственный технический университет им. Н.Э. Баумана",
    "Национальный исследовательский ядерный университет «МИФИ»",
    "Российский университет дружбы народов",
    "Саратовский национальный исследовательский государственный университет",
    "Пермский государственный национальный исследовательский университет",
    "Белгородский государственный университет",
    "Воронежский государственный университет",
    "Нижегородский государственный университет им. Н.И. Лобачевского",
    "Ростовский государственный университет",
    "Санкт-Петербургский политехнический университет Петра Великого",
    "Московский авиационный институт",
    "Московский государственный лингвистический университет",
]


@lru_cache(maxsize=8)
def load_cyrillic_font(size: int):
    """Load a TrueType/OpenType font that can render Cyrillic text."""
    global _FONT_WARNING_PRINTED

    candidates = []
    if DEMO_SEED_FONT_PATH:
        candidates.append(DEMO_SEED_FONT_PATH)
    candidates.extend(CYRILLIC_FONT_PATHS)

    fc_match_path = find_font_with_fc_match()
    if fc_match_path:
        candidates.append(fc_match_path)

    seen = set()
    for font_path in candidates:
        if not font_path or font_path in seen:
            continue
        seen.add(font_path)

        if not os.path.isfile(font_path):
            if font_path == DEMO_SEED_FONT_PATH:
                print(
                    f"Предупреждение: DEMO_SEED_FONT_PATH={font_path!r} не найден. "
                    "Пробуем системные шрифты."
                )
            continue

        try:
            return ImageFont.truetype(font_path, size)
        except OSError as e:
            if font_path == DEMO_SEED_FONT_PATH:
                print(
                    f"Предупреждение: Pillow не смог открыть DEMO_SEED_FONT_PATH={font_path!r}: {e}. "
                    "Пробуем системные шрифты."
                )

    if not _FONT_WARNING_PRINTED:
        print(
            "Предупреждение: не найден TTF/TTC-шрифт с поддержкой кириллицы. "
            "Preview-текст может отображаться квадратами. "
            "Установите DejaVu, Noto или Liberation Sans либо задайте DEMO_SEED_FONT_PATH."
        )
        _FONT_WARNING_PRINTED = True

    return ImageFont.load_default()


@lru_cache(maxsize=1)
def find_font_with_fc_match() -> str:
    """Ask fontconfig for a suitable font when fc-match is available."""
    try:
        result = subprocess.run(
            ["fc-match", "-f", "%{file}", "DejaVu Sans,Noto Sans,Liberation Sans"],
            check=False,
            capture_output=True,
            text=True,
            timeout=2,
        )
    except (FileNotFoundError, subprocess.SubprocessError, OSError):
        return ""

    font_path = result.stdout.strip()
    if result.returncode == 0 and font_path:
        return font_path
    return ""

# Список категорий (только для справки, не используются для создания)
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


class TestDataGenerator:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.users = []
        self.categories = []  # Будут заполнены из БД
        self.universities = []  # Университеты из БД
        self.projects = []
        self.comments = []
        self.likes = []
        self.cookies = {}
        # Создаем папку для временных изображений
        self.temp_dir = "temp_images"
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir)

    def get_existing_categories(self) -> List[Dict[str, Any]]:
        """Получение существующих категорий из БД"""
        url = f"{self.base_url}/category/"
        try:
            response = requests.get(url)
            response.raise_for_status()
            categories = response.json()
            print(f"Найдено {len(categories)} существующих категорий")
            return categories
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при получении категорий: {e}")
            return []

    def get_existing_universities(self) -> List[Dict[str, Any]]:
        """Получение существующих университетов из БД"""
        url = f"{self.base_url}/university/?count=500"
        try:
            response = requests.get(url)
            response.raise_for_status()
            universities = response.json()
            print(f"Найдено {len(universities)} существующих университетов")
            return universities
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при получении университетов: {e}")
            return []

    def create_university(self, name: str) -> Optional[Dict[str, Any]]:
        """Создание университета"""
        url = f"{self.base_url}/university/"
        payload = {"name": name}
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response and e.response.status_code == 400:
                # Университет уже существует
                return None
            print(f"Ошибка при создании университета {name}: {e}")
            return None

    def register_user(self, email: str, password: str, name: str, university_id: Optional[int] = None) -> Dict[str, Any]:
        """Регистрация пользователя с указанием университета"""
        url = f"{self.base_url}/auth/register"
        payload = {
            "email": email,
            "password": password,
            "name": name,
            "is_active": True,
            "is_superuser": False,
            "is_verified": True,
        }

        # Добавляем университет, если указан
        if university_id is not None:
            payload["university_id"] = university_id

        # Добавляем дополнительные поля
        payload["bio"] = fake.sentence(nb_words=10)
        payload["skills"] = ", ".join([fake.job() for _ in range(random.randint(2, 5))])
        payload["image_url"] = None

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            status_code = getattr(getattr(e, "response", None), "status_code", None)
            if status_code == 400:
                print(f"Пользователь {email} уже существует, пробуем войти")
            else:
                print(f"Ошибка при регистрации пользователя {email}: {e}")
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
            print(f"Ошибка при входе пользователя {email}: {e}")
            return False

    def get_current_user(self, cookies: Dict[str, Any]) -> Dict[str, Any]:
        """Получение текущего пользователя после входа"""
        url = f"{self.base_url}/users/me"
        try:
            response = requests.get(url, cookies=cookies)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при получении текущего пользователя: {e}")
            return None

    def get_my_projects(self, user_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Получение проектов demo-пользователя для безопасного повторного запуска"""
        url = f"{self.base_url}/projects/my"
        try:
            response = requests.get(url, cookies=user_info.get("cookies", {}))
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при получении проектов пользователя {user_info['email']}: {e}")
            return []

    def create_user(self, user_number: int) -> Dict[str, Any]:
        """Создание пользователя с регистрацией и входом"""
        # Генерируем данные пользователя на русском
        first_name = fake.first_name_male() if random.choice([True, False]) else fake.first_name_female()
        last_name = fake.last_name_male() if random.choice([True, False]) else fake.last_name_female()
        name = f"{first_name} {last_name}"

        email = f"{DEMO_SEED_USER_PREFIX}{user_number}@{DEMO_SEED_EMAIL_DOMAIN}"
        password = DEMO_SEED_PASSWORD

        # Выбираем случайный университет
        university = None
        university_id = None
        if self.universities:
            university = random.choice(self.universities)
            university_id = university["id"]
            print(f"  Для пользователя {name} выбран университет: {university['name']}")

        # Регистрируем пользователя
        user = self.register_user(email, password, name, university_id)
        user_created = user is not None

        # Входим в систему
        if not self.login_user(email, password):
            return None

        if not user:
            user = self.get_current_user(self.cookies)
            if not user:
                return None

        # Сохраняем данные для использования в проектах
        user_info = {
            "id": user["id"],
            "email": email,
            "password": password,
            "name": name,
            "cookies": self.cookies.copy(),
            "created": user_created,
            "university_id": university_id,
            "university_name": university["name"] if university else None,
        }
        return user_info

    def generate_project_image(
        self, title: str, width: int = 800, height: int = 400
    ) -> bytes:
        """Генерация изображения для проекта с текстом по центру"""
        # Создаем белое изображение
        image = Image.new("RGB", (width, height), color="white")
        draw = ImageDraw.Draw(image)

        # Пытаемся загрузить шрифт с поддержкой кириллицы
        font_size = min(width, height) // 12

        font = load_cyrillic_font(font_size)

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

    def generate_field_content(self, field_type: str) -> str:
        """Генерация содержимого для дополнительных полей проекта"""
        if field_type == "practical_benefit":
            templates = [
                "Повышение эффективности работы команды на 30% за счет автоматизации рутинных задач",
                "Снижение времени на выполнение операций в 2 раза",
                "Упрощение процесса взаимодействия между отделами компании",
                "Автоматизация документооборота и сокращение бумажной работы",
                "Улучшение качества обслуживания клиентов благодаря быстрому доступу к данным",
                "Экономия ресурсов компании за счет оптимизации бизнес-процессов",
                "Повышение прозрачности и контролируемости всех этапов работы",
                f"Сокращение затрат на {fake.word()} на 25%",
                f"Увеличение производительности труда на {random.randint(15, 50)}%",
                "Оптимизация рабочих процессов и снижение нагрузки на сотрудников",
                "Быстрый доступ к актуальной информации в реальном времени",
                "Улучшение коммуникации между участниками проекта",
            ]
            return random.choice(templates)

        elif field_type == "implementation_details":
            templates = [
                "Реализовано на основе микросервисной архитектуры с использованием Docker и Kubernetes",
                "Разработано с использованием современного стека технологий: Python, FastAPI, PostgreSQL",
                "Интегрировано с существующими системами компании через REST API",
                "Внедрена система мониторинга и оповещения на базе Prometheus и Grafana",
                "Использована методология Agile с двухнедельными спринтами",
                "Реализована система аутентификации и авторизации с JWT токенами",
                "Настроена автоматическая сборка и деплой через CI/CD пайплайн",
                "Разработана удобная и интуитивно понятная система управления данными",
                "Внедрена система логирования и отслеживания ошибок",
                f"Технологический стек: {fake.word()}, {fake.word()}, {fake.word()}",
                "Реализована система резервного копирования и восстановления данных",
                "Обеспечена высокая отказоустойчивость и масштабируемость системы",
                "Проведено тестирование производительности и оптимизация запросов",
            ]
            return random.choice(templates)

        elif field_type == "results":
            templates = [
                "Проект успешно внедрен и используется в повседневной работе компании",
                "Достигнуты все поставленные цели в установленные сроки",
                "Получены положительные отзывы от пользователей и руководства",
                "Система стабильно работает и показывает высокую производительность",
                f"Количество активных пользователей достигло {random.randint(100, 1000)} человек",
                "Удалось сократить время обработки запросов на 40%",
                "Проект масштабирован на все отделы компании",
                "Достигнута высокая степень автоматизации бизнес-процессов",
                "Получен экономический эффект в размере {random.randint(100, 500)} тыс. рублей",
                "Улучшена система отчетности и аналитики данных",
                "Проект отмечен как лучший инновационный проект года в компании",
                "Создана база знаний и документация для дальнейшего развития",
                "Формирование устойчивой обратной связи от пользователей",
            ]
            return random.choice(templates)

        return ""

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

        # Данные для multipart/form-data
        data = {
            "title": title,
            "description": description,
            "status": status,
            "practical_benefit": self.generate_field_content("practical_benefit"),
            "implementation_details": self.generate_field_content("implementation_details"),
            "results": self.generate_field_content("results"),
        }

        if category_id:
            data["category_id"] = str(category_id)

        # Файл для загрузки
        files = {}
        if image_bytes:
            # Используем русское название файла (транслитерируем для безопасности)
            safe_title = ''.join(c if c.isalnum() else '_' for c in title[:30])
            files["file"] = (f"{safe_title}.png", image_bytes, "image/png")

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
            print(f"Ошибка при создании проекта {title}: {e}")
            if hasattr(e, "response") and e.response:
                print(f"Код статуса: {e.response.status_code}")
                print(f"Ответ: {e.response.text}")
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
            print(f"Ошибка при создании комментария: {e}")
            if hasattr(e, "response") and e.response:
                print(f"Код статуса: {e.response.status_code}")
                print(f"Ответ: {e.response.text}")
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
            print(f"Ошибка при создании лайка: {e}")
            if hasattr(e, "response") and e.response:
                print(f"Код статуса: {e.response.status_code}")
                print(f"Ответ: {e.response.text}")
            return False

    def generate_comments_for_project(self, project: Dict[str, Any], num_comments: int):
        """Генерация комментариев для проекта"""
        print(f"  Генерация {num_comments} комментариев для проекта: {project['title']}")

        # Выбираем случайных пользователей для комментирования
        available_users = [u for u in self.users if u["id"] != project.get("owner_id")]
        if not available_users:
            print("    Нет других пользователей для комментирования")
            return

        for i in range(num_comments):
            # Выбираем случайного пользователя
            user = random.choice(available_users)

            # Генерируем текст комментария на русском
            comment_texts = [
                fake.sentence(nb_words=10),
                fake.paragraph(nb_sentences=2),
                f"Отличный проект! {fake.sentence(nb_words=5)}",
                f"Интересная работа! {fake.sentence(nb_words=6)}",
                f"Классно! {fake.sentence(nb_words=4)}",
                fake.sentence(nb_words=8),
                f"Мне нравится этот проект, потому что {fake.sentence(nb_words=7)}",
                f"Хорошая работа! {fake.sentence(nb_words=5)}",
                fake.paragraph(nb_sentences=1),
                f"Жду продолжения! {fake.sentence(nb_words=4)}",
                f"Отличная идея! {fake.sentence(nb_words=5)}",
                f"Здорово получилось! {fake.sentence(nb_words=4)}",
                f"Крутой проект! {fake.sentence(nb_words=6)}",
            ]
            text = random.choice(comment_texts)

            # Создаем комментарий
            comment = self.create_comment(user, project["id"], text)
            if comment:
                self.comments.append(comment)
                print(f"    Создан комментарий от {user['name']}: {text[:50]}...")

            # Небольшая задержка
            time.sleep(0.1)

    def generate_likes_for_project(self, project: Dict[str, Any], num_likes: int):
        """Генерация лайков для проекта"""
        print(f"  Генерация {num_likes} лайков для проекта: {project['title']}")

        # Выбираем случайных пользователей для лайков
        available_users = [u for u in self.users if u["id"] != project.get("owner_id")]
        if not available_users:
            print("    Нет других пользователей для лайков")
            return

        # Выбираем уникальных пользователей для лайков
        num_likes = min(num_likes, len(available_users))
        selected_users = random.sample(available_users, num_likes)

        for user in selected_users:
            # Создаем лайк
            if self.create_like(user, project["id"]):
                self.likes.append({"user_id": user["id"], "project_id": project["id"]})
                print(f"    Создан лайк от {user['name']}")

            # Небольшая задержка
            time.sleep(0.1)

    def generate_project_data(self, user_info: Dict[str, Any], num_projects: int = 10):
        """Генерация проектов для пользователя с комментариями и лайками"""
        print(f"\nГенерация проектов для пользователя: {user_info['name']}")

        # Шаблоны для названий проектов на русском
        project_templates = [
            "Платформа для {topic}",
            "Сервис {topic}",
            "Инструмент {topic}",
            "Система {topic}",
            "Приложение для {topic}",
            "Редактор {topic}",
            "Менеджер {topic}",
            "Конструктор {topic}",
            "Помощник в {topic}",
            "Аналитика {topic}",
            "Портал {topic}",
            "База знаний по {topic}",
        ]

        topics = [
            "аналитики", "безопасности", "разработки", "тестирования", "дизайна",
            "управления проектами", "коммуникации", "образования", "автоматизации",
            "обработки данных", "распознавания текста", "генерации контента",
            "социальных сетей", "музыки", "стриминга", "документации"
        ]

        for i in range(num_projects):
            # Генерация данных проекта на русском
            template = random.choice(project_templates)
            topic = random.choice(topics)
            title = template.format(topic=topic)

            # Добавляем номер, чтобы названия не повторялись
            if i > 0:
                title = f"{title} v{i+1}"

            # Генерируем описание на русском
            description_templates = [
                f"Проект представляет собой {fake.sentence(nb_words=8)}. Основная цель - {fake.sentence(nb_words=6)}.",
                f"Инновационное решение в области {topic}. Позволяет {fake.sentence(nb_words=5)}.",
                f"Современный инструмент для {topic}. Включает в себя {fake.sentence(nb_words=7)}.",
                f"Удобная система для работы с {topic}. Предоставляет возможности {fake.sentence(nb_words=6)}.",
                f"Комплексное решение для {topic}. Обеспечивает {fake.sentence(nb_words=8)}.",
                f"Платформа для эффективного управления {topic}. Функционал позволяет {fake.sentence(nb_words=6)}.",
            ]
            description = random.choice(description_templates)

            # Выбираем случайную категорию из существующих
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
                    f"  Создан проект: {project['title']} (статус: {project['status']}, есть изображение: {bool(project.get('image_url'))})"
                )
                if project.get("image_url"):
                    print(f"    URL изображения: {project['image_url']}")

                # Выводим информацию о новых полях
                if project.get("practical_benefit"):
                    print(f"    Практическая польза: {project['practical_benefit'][:50]}...")
                if project.get("implementation_details"):
                    print(f"    Детали внедрения: {project['implementation_details'][:50]}...")
                if project.get("results"):
                    print(f"    Результаты: {project['results'][:50]}...")

                # Добавляем комментарии и лайки только для опубликованных проектов
                if project["status"] == "published" and len(self.users) > 1:
                    # Количество комментариев: от 0 до заданного env-лимита
                    num_comments = random.randint(0, DEMO_SEED_MAX_COMMENTS_PER_PROJECT)
                    if num_comments > 0:
                        self.generate_comments_for_project(project, num_comments)

                    # Количество лайков: от 0 до заданного env-лимита
                    num_likes = random.randint(0, DEMO_SEED_MAX_LIKES_PER_PROJECT)
                    if num_likes > 0:
                        self.generate_likes_for_project(project, num_likes)
                else:
                    if project["status"] != "published":
                        print(f"    Пропуск комментариев/лайков для черновика")
                    elif len(self.users) <= 1:
                        print(f"    Недостаточно пользователей для комментариев/лайков")
            else:
                print(f"  Не удалось создать проект: {title}")

            # Небольшая задержка для избежания перегрузки API
            time.sleep(0.1)

    def setup_universities(self):
        """Настройка университетов"""
        print("\nПолучение существующих университетов...")
        self.universities = self.get_existing_universities()

        if not self.universities:
            print("Создание университетов...")
            for uni_name in UNIVERSITIES:
                uni = self.create_university(uni_name)
                if uni:
                    self.universities.append(uni)
                    print(f"  Создан университет: {uni['name']}")
                time.sleep(0.1)
        else:
            print(f"Используется {len(self.universities)} существующих университетов")

    def generate_all_data(self, num_users: int = 5, projects_per_user: int = 10):
        """Генерация всех тестовых данных"""
        print("=" * 50)
        print("Начало генерации тестовых данных")
        print("=" * 50)

        # Получаем существующие категории из БД
        print("\nПолучение существующих категорий...")
        self.categories = self.get_existing_categories()

        if not self.categories:
            print("ПРЕДУПРЕЖДЕНИЕ: В базе данных не найдено категорий. Проекты будут создаваться без категорий.")
        else:
            print(f"Используется {len(self.categories)} категорий из базы данных")

        # Настраиваем университеты
        self.setup_universities()

        # Создаем пользователей
        print("\nСоздание пользователей...")
        for i in range(num_users):
            user_info = self.create_user(i + 1)
            if user_info:
                self.users.append(user_info)
                action = "Создан" if user_info.get("created") else "Использован"
                university_info = f" (университет: {user_info.get('university_name', 'Не указан')})"
                print(
                    f"  {action} пользователь: {user_info['name']} (email: {user_info['email']}){university_info}"
                )
            else:
                print(f"  Не удалось создать пользователя {i+1}")

            # Небольшая задержка между пользователями
            time.sleep(0.5)

        # Создаем проекты для каждого пользователя
        print(f"\nСоздание проектов для {len(self.users)} пользователей...")
        for user_info in self.users:
            existing_projects = self.get_my_projects(user_info)
            if existing_projects:
                print(
                    f"У пользователя {user_info['email']} уже есть проекты: {len(existing_projects)}. "
                    "Пропускаем, чтобы повторный запуск не создавал дубли."
                )
                self.projects.extend(existing_projects)
                continue
            self.generate_project_data(user_info, projects_per_user)

        # Выводим статистику
        print("\n" + "=" * 50)
        print("ГЕНЕРАЦИЯ ДАННЫХ ЗАВЕРШЕНА")
        print("=" * 50)
        print(f"Использовано категорий: {len(self.categories)}")
        print(f"Университетов: {len(self.universities)}")
        print(f"Пользователей: {len(self.users)}")
        print(f"Проектов: {len(self.projects)}")
        print(f"Комментариев: {len(self.comments)}")
        print(f"Лайков: {len(self.likes)}")

        # Статистика по университетам пользователей
        users_with_university = sum(1 for u in self.users if u.get("university_id"))
        print(f"Пользователей с университетами: {users_with_university} ({users_with_university/len(self.users)*100:.1f}%)")

        # Статистика по статусам проектов
        if self.projects:
            published = sum(1 for p in self.projects if p.get("status") == "published")
            draft = len(self.projects) - published
            print(
                f"Опубликовано проектов: {published} ({published/len(self.projects)*100:.1f}%)"
            )
            print(f"Черновиков: {draft} ({draft/len(self.projects)*100:.1f}%)")

            # Статистика по изображениям
            has_image = sum(1 for p in self.projects if p.get("image_url"))
            print(
                f"Проектов с изображением: {has_image} ({has_image/len(self.projects)*100:.1f}%)"
            )

            # Статистика по новым полям
            has_practical_benefit = sum(1 for p in self.projects if p.get("practical_benefit"))
            has_implementation_details = sum(1 for p in self.projects if p.get("implementation_details"))
            has_results = sum(1 for p in self.projects if p.get("results"))

            print(f"Проектов с практической пользой: {has_practical_benefit} ({has_practical_benefit/len(self.projects)*100:.1f}%)")
            print(f"Проектов с деталями внедрения: {has_implementation_details} ({has_implementation_details/len(self.projects)*100:.1f}%)")
            print(f"Проектов с результатами: {has_results} ({has_results/len(self.projects)*100:.1f}%)")

        # Выводим примеры пользователей и их проектов
        print("\n" + "=" * 50)
        print("Примеры данных:")
        print("=" * 50)
        for user_info in self.users[:3]:  # Показываем первых 3 пользователей
            user_projects = [
                p for p in self.projects if p.get("owner", {}).get("id") == user_info["id"]
            ]
            print(f"\nПользователь: {user_info['name']} (ID: {user_info['id']})")
            print(f"  Email: {user_info['email']}")
            print(f"  Университет: {user_info.get('university_name', 'Не указан')}")
            print(f"  Проектов: {len(user_projects)}")

            # Показываем комментарии и лайки для проектов
            for project in user_projects[:3]:  # Показываем первые 3 проекта
                image_status = "✅" if project.get("image_url") else "❌"
                print(
                    f"    {image_status} {project['title']} ({project.get('status', 'неизвестно')})"
                )

                # Показываем новые поля
                if project.get("practical_benefit"):
                    print(f"       Практическая польза: {project['practical_benefit'][:60]}...")
                if project.get("implementation_details"):
                    print(f"       Детали внедрения: {project['implementation_details'][:60]}...")
                if project.get("results"):
                    print(f"       Результаты: {project['results'][:60]}...")

                # Считаем комментарии и лайки для этого проекта
                project_comments = [
                    c for c in self.comments if c.get("project_id") == project["id"]
                ]
                project_likes = [
                    l for l in self.likes if l.get("project_id") == project["id"]
                ]

                if project_comments:
                    print(f"       Комментариев: {len(project_comments)}")
                    for comment in project_comments[:2]:
                        print(f"         - {comment.get('text', '')[:50]}...")
                if project_likes:
                    print(f"       Лайков: {len(project_likes)}")

                if project.get("image_url"):
                    print(f"       Изображение: {project['image_url']}")

            if len(user_projects) > 3:
                print(f"    ... и еще {len(user_projects) - 3} проектов")


def main() -> int:
    if os.getenv("ALLOW_DEMO_SEED") != "1":
        print("Demo seed отключен. Запустите вручную с ALLOW_DEMO_SEED=1.")
        return 1

    # Создаем экземпляр генератора
    generator = TestDataGenerator(BASE_URL)

    # Проверяем доступность API
    try:
        response = requests.get(f"{BASE_URL}/category/")
        if response.status_code != 200:
            print(
                f"Предупреждение: API может быть недоступен (код статуса: {response.status_code})"
            )
            print("Убедитесь, что сервер запущен и BASE_URL указан правильно.")
            return 1
    except requests.exceptions.RequestException:
        print(f"Ошибка: Не удалось подключиться к API по адресу {BASE_URL}")
        print("Убедитесь, что сервер запущен и BASE_URL указан правильно.")
        return 1

    try:
        # Генерируем тестовые данные
        generator.generate_all_data(
            num_users=DEMO_SEED_USERS,
            projects_per_user=DEMO_SEED_PROJECTS_PER_USER,
        )
    except KeyboardInterrupt:
        print("\n\nГенерация данных прервана пользователем.")
        return 130
    except Exception as e:
        print(f"\nНеожиданная ошибка: {e}")
        import traceback

        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())