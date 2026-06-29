-- seed_for_db_utf8.sql (с русским языком, UTF-8)

INSERT INTO project_category (name, slug) VALUES
('Аналитика, безопасность и SEO', 'analitika-bezopasnost-i-seo'),
('DevOps и мониторинг', 'devops-i-monitoring'),
('Документация и генерация текстов', 'dokumentatsiya-i-generatsiya-tekstov'),
('Коммуникации и мессенджеры', 'kommunikatsii-i-messendzhery'),
('Музыка и стриминг', 'muzyka-i-striming'),
('No-code конструкторы', 'no-code-konstruktory'),
('Образование и управление практикой', 'obrazovanie-i-upravlenie-praktikoy'),
('Редакторы мультимедиа', 'redaktory-multimedia'),
('Социальные сети и знакомства', 'sotsialnye-seti-i-znakomstva'),
('Управление персоналом и компетенциями', 'upravlenie-personalom-i-kompetentsiyami'),
('Управление проектами и баг-трекинг', 'upravlenie-proektami-i-bag-treking'),
('Фриланс и биржи', 'frilans-i-birzhi')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO roles (name, description) VALUES
-- Управление проектом
('Руководитель проекта', 'Руководитель проекта, отвечает за планирование и координацию'),
('Владелец продукта', 'Владелец продукта, определяет требования и приоритеты'),
('Scrum-мастер', 'Scrum-мастер, фасилитирует процессы Agile'),

-- Аналитика
('Бизнес-аналитик', 'Бизнес-аналитик, анализирует требования и процессы'),
('Системный аналитик', 'Системный аналитик, проектирует архитектуру системы'),
('Аналитик данных', 'Аналитик данных, работает с данными и метриками'),

-- Backend-разработка
('Backend-разработчик', 'Backend-разработчик, отвечает за серверную часть'),
('Python-разработчик', 'Python-разработчик, специалист по Python'),
('Java-разработчик', 'Java-разработчик, специалист по Java'),
('Node.js-разработчик', 'Node.js-разработчик, специалист по JavaScript на сервере'),
('PHP-разработчик', 'PHP-разработчик, специалист по PHP'),
('Go-разработчик', 'Go-разработчик, специалист по Go'),
('Rust-разработчик', 'Rust-разработчик, специалист по Rust'),

-- Frontend-разработка
('Frontend-разработчик', 'Frontend-разработчик, отвечает за клиентскую часть'),
('React-разработчик', 'React-разработчик, специалист по React'),
('Angular-разработчик', 'Angular-разработчик, специалист по Angular'),
('Vue.js-разработчик', 'Vue.js-разработчик, специалист по Vue.js'),
('Мобильный разработчик', 'Мобильный разработчик, создает мобильные приложения'),
('iOS-разработчик', 'iOS-разработчик, специалист по Swift/Objective-C'),
('Android-разработчик', 'Android-разработчик, специалист по Kotlin/Java'),
('Flutter-разработчик', 'Flutter-разработчик, специалист по Flutter'),
('React Native-разработчик', 'React Native-разработчик, специалист по React Native'),

-- Fullstack
('Fullstack-разработчик', 'Fullstack-разработчик, работает и с фронтендом, и с бэкендом'),

-- DevOps и инфраструктура
('DevOps-инженер', 'DevOps-инженер, отвечает за CI/CD и инфраструктуру'),
('SRE-инженер', 'SRE-инженер, обеспечивает надежность сервисов'),
('Системный администратор', 'Системный администратор, управляет серверами'),
('Cloud-инженер', 'Cloud-инженер, работает с облачными платформами'),
('Сетевой инженер', 'Сетевой инженер, проектирует и управляет сетями'),
('Инженер по безопасности', 'Инженер по безопасности, обеспечивает защиту системы'),
('Администратор БД', 'Администратор баз данных, управляет базами данных'),

-- Тестирование
('QA-инженер', 'QA-инженер, обеспечивает качество продукта'),
('Автоматизатор тестирования', 'Автоматизатор тестирования, пишет автотесты'),
('Ручной тестировщик', 'Ручной тестировщик, проводит ручное тестирование'),
('Тестировщик производительности', 'Тестировщик производительности, тестирует нагрузку'),
('Тестировщик безопасности', 'Тестировщик безопасности, проверяет уязвимости'),

-- Дизайн
('UI-дизайнер', 'UI-дизайнер, проектирует интерфейсы'),
('UX-дизайнер', 'UX-дизайнер, проектирует пользовательский опыт'),
('Продуктовый дизайнер', 'Продуктовый дизайнер, разрабатывает дизайн продукта'),
('Графический дизайнер', 'Графический дизайнер, создает визуальные элементы'),

-- Менеджмент и координация
('Тимлид', 'Тимлид, руководит командой разработки'),
('Технический лид', 'Технический лид, отвечает за технические решения'),
('Архитектор', 'Архитектор, проектирует архитектуру системы'),
('Архитектор решений', 'Архитектор решений, разрабатывает технические стратегии'),

-- Data Science и ML
('Data Scientist', 'Data Scientist, работает с данными и ML-моделями'),
('ML-инженер', 'ML-инженер, разрабатывает и внедряет ML-модели'),
('MLOps-инженер', 'MLOps-инженер, автоматизирует ML-пайплайны'),
('Data-инженер', 'Data-инженер, строит пайплайны данных'),

-- Специализированные
('Blockchain-разработчик', 'Blockchain-разработчик, работает с блокчейн-технологиями'),
('Game-разработчик', 'Game-разработчик, создает игры'),
('Embedded-разработчик', 'Embedded-разработчик, работает с встраиваемыми системами'),
('AR/VR-разработчик', 'AR/VR-разработчик, создает дополненную и виртуальную реальность'),

-- Документация и контент
('Технический писатель', 'Технический писатель, создает документацию'),
('Создатель контента', 'Создатель контента, пишет статьи и материалы'),

-- Поддержка
('Инженер поддержки', 'Инженер поддержки, помогает пользователям'),
('Менеджер по работе с клиентами', 'Менеджер по работе с клиентами, обеспечивает успех клиентов'),

-- Базовые роли для студенческих проектов
('Студент', 'Студент, участник проекта'),
('Ментор', 'Ментор, наставник проекта'),
('Наблюдатель', 'Наблюдатель, следит за ходом проекта')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- seed_for_db_utf8.sql (продолжение)

INSERT INTO technology (name) VALUES
-- Языки программирования
('Python'),
('Java'),
('JavaScript'),
('TypeScript'),
('C++'),
('C#'),
('PHP'),
('Go'),
('Rust'),
('Swift'),
('Kotlin'),
('Ruby'),
('Scala'),
('Perl'),
('Lua'),
('R'),
('MATLAB'),
('Dart'),
('Elixir'),
('Clojure'),

-- Фреймворки и библиотеки (Backend)
('Django'),
('Flask'),
('FastAPI'),
('Spring Boot'),
('Spring Framework'),
('Hibernate'),
('Express.js'),
('NestJS'),
('ASP.NET Core'),
('Laravel'),
('Symfony'),
('Ruby on Rails'),
('Phoenix Framework'),
('Actix Web'),
('Axum'),

-- Фреймворки и библиотеки (Frontend)
('React'),
('Angular'),
('Vue.js'),
('Svelte'),
('Next.js'),
('Nuxt.js'),
('Gatsby'),
('Tailwind CSS'),
('Bootstrap'),
('Material UI'),
('Ant Design'),
('Chakra UI'),
('Styled Components'),
('Redux'),
('MobX'),
('Zustand'),
('React Query'),
('GraphQL'),
('Apollo Client'),

-- Мобильная разработка
('Flutter'),
('React Native'),
('SwiftUI'),
('UIKit'),
('Android SDK'),
('Jetpack Compose'),
('Xamarin'),
('Ionic'),

-- Базы данных
('PostgreSQL'),
('MySQL'),
('MongoDB'),
('Redis'),
('Elasticsearch'),
('Cassandra'),
('Neo4j'),
('DynamoDB'),
('Oracle Database'),
('SQLite'),
('MariaDB'),
('ClickHouse'),
('TimescaleDB'),
('InfluxDB'),

-- ORM и миграции
('SQLAlchemy'),
('Sequelize'),
('TypeORM'),
('Prisma'),
('Drizzle'),
('Entity Framework'),
('GORM'),
('Mongoose'),

-- DevOps и инфраструктура
('Docker'),
('Kubernetes'),
('Docker Compose'),
('Terraform'),
('Ansible'),
('Puppet'),
('Chef'),
('Helm'),
('Istio'),
('Linkerd'),
('Envoy'),
('Nginx'),
('Apache'),
('HAProxy'),
('Traefik'),
('Caddy'),

-- CI/CD
('Jenkins'),
('GitLab CI/CD'),
('GitHub Actions'),
('CircleCI'),
('Travis CI'),
('ArgoCD'),
('Spinnaker'),
('TeamCity'),
('Bamboo'),

-- Облачные технологии
('AWS'),
('Microsoft Azure'),
('Google Cloud Platform (GCP)'),
('Yandex Cloud'),
('VK Cloud'),
('S3'),
('EC2'),
('Lambda'),
('Cloud Functions'),
('Cloud Run'),
('Fargate'),

-- Мониторинг и логирование
('Prometheus'),
('Grafana'),
('AlertManager'),
('Zabbix'),
('Nagios'),
('Datadog'),
('New Relic'),
('ELK Stack'),
('Loki'),
('Fluentd'),
('Logstash'),
('Kibana'),
('Sentry'),
('Jaeger'),
('Zipkin'),
('OpenTelemetry'),

-- Брокеры сообщений и стриминг
('Apache Kafka'),
('RabbitMQ'),
('Redis Pub/Sub'),
('Apache Pulsar'),
('NATS'),
('ActiveMQ'),
('Apache Spark'),
('Apache Flink'),
('Apache Storm'),

-- Тестирование
('pytest'),
('JUnit'),
('TestNG'),
('Selenium'),
('Cypress'),
('Playwright'),
('Jest'),
('Mocha'),
('Chai'),
('PyTest'),
('Robot Framework'),
('Cucumber'),
('Gatling'),
('k6'),
('JMeter'),
('Postman'),
('Insomnia'),
('Swagger'),
('OpenAPI'),

-- Безопасность
('JWT'),
('OAuth 2.0'),
('OpenID Connect'),
('SSL/TLS'),
('Let''s Encrypt'),
('Vault'),
('Keycloak'),
('OAuth2 Proxy'),
('modsecurity'),

-- Аналитика данных и BI
('Apache Airflow'),
('Apache Hadoop'),
('Apache Hive'),
('Apache Pig'),
('Tableau'),
('Power BI'),
('Metabase'),
('Superset'),
('Redash'),
('DVC'),
('dbt'),
('Great Expectations'),

-- Машинное обучение и AI
('TensorFlow'),
('PyTorch'),
('scikit-learn'),
('Keras'),
('XGBoost'),
('LightGBM'),
('CatBoost'),
('OpenCV'),
('Hugging Face'),
('LangChain'),
('LlamaIndex'),
('MLflow'),
('Kubeflow'),
('Ray'),
('ONNX'),

-- Графика и мультимедиа
('OpenGL'),
('Vulkan'),
('Unity 3D'),
('Unreal Engine'),
('Blender'),
('Three.js'),
('D3.js'),
('WebGL'),
('FFmpeg'),
('GStreamer'),

-- Документация и коллаборация
('Jira'),
('Confluence'),
('Trello'),
('Asana'),
('Notion'),
('Miro'),
('Figma'),
('Sketch'),
('Adobe XD'),
('Storybook'),
('MadCap Flare'),
('Sphinx'),
('MkDocs'),
('Docusaurus'),

-- Коммуникации
('Slack'),
('Telegram'),
('Discord'),
('Microsoft Teams'),
('Zoom'),

-- Версионирование и код-ревью
('Git'),
('GitHub'),
('GitLab'),
('Bitbucket'),
('Gerrit'),

-- Пакетные менеджеры и сборка
('npm'),
('yarn'),
('pnpm'),
('pip'),
('Poetry'),
('conda'),
('Maven'),
('Gradle'),
('Webpack'),
('Vite'),
('Parcel'),
('esbuild'),
('swc'),

-- Протоколы и форматы данных
('RESTful API'),
('gRPC'),
('GraphQL'),
('WebSocket'),
('JSON'),
('Protobuf'),
('Avro'),
('Parquet'),
('ORC'),

-- Блокчейн
('Ethereum'),
('Bitcoin'),
('Smart Contracts'),
('Solidity'),
('Web3.js'),
('ethers.js'),
('IPFS'),

-- Специализированное
('WebAssembly (WASM)'),
('LLVM'),
('CUDA'),
('OpenMP'),
('MPI'),
('QT'),
('GTK'),
('Electron'),
('Tauri'),
('Node.js'),
('Deno'),
('Bun')
ON CONFLICT (name) DO NOTHING;

INSERT INTO universities (name) VALUES
('Московский технический университет связи и информатики (МТУСИ)'),
('Национальный исследовательский университет "Высшая школа экономики" (НИУ ВШЭ)'),
('Московский государственный технический университет им. Н.Э. Баумана (МГТУ им. Баумана)'),
('Московский физико-технический институт (МФТИ)'),
('Санкт-Петербургский государственный университет (СПбГУ)')
ON CONFLICT (name) DO NOTHING;