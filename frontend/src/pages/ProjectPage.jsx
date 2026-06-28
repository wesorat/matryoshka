import React, { useState, useEffect } from 'react';
import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx';
import CategorySection from '../components/CategorySection/CategorySection.jsx';
import Button from '../components/Buttons/Button.jsx';
import { fetchProjectById } from '../api.js';
import styles from './ProjectPage.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ProjectPage({ project: initialProject, projectId, onBack }) {
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = projectId || initialProject?.id || initialProject?._id;
    if (id && (!initialProject || (!initialProject.practical_benefit && !initialProject.practicalBenefit))) {
      setLoading(true);
      setError('');
      fetchProjectById(id)
        .then((data) => {
          setProject(data);
        })
        .catch((err) => {
          console.error(err);
          setError('Не удалось загрузить подробную информацию о проекте.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProject(initialProject);
    }
  }, [projectId, initialProject]);

  if (loading) {
    return (
      <section className={styles.empty}>
        <h1>Загрузка проекта...</h1>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className={styles.empty}>
        <h1>{error || 'Проект не найден'}</h1>
        <Button type="button" variant="outline" onClick={onBack}>
          Вернуться
        </Button>
      </section>
    );
  }

  // Улучшенная вспомогательная функция для построения абсолютного URL медиафайла
  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // Убираем ведущий слэш, если он есть
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    // Если бэкенд уже вернул путь вместе с папками, не дублируем их
    if (cleanUrl.startsWith('media/uploads/')) {
      return `${API_URL}/${cleanUrl}`;
    }
    return `${API_URL}/media/uploads/${cleanUrl}`; 
  };

  // Собираем реальный массив слайдов для галереи HeroGallery
  const slides = [];

  // 1. Добавляем главное изображение проекта (проверяем все возможные ключи от бэкенда)
  const mainImage = project.image_url || project.image || project.file_path || project.file;
  if (mainImage) {
    slides.push({
      image: getMediaUrl(mainImage), // HeroGallery ожидает именно ключ .image
      title: project.title || 'Главное изображение',
      description: project.description || ''
    });
  }

  // 2. Добавляем дополнительные картинки из массива medias, если бэкенд их вернет
  if (project.medias && Array.isArray(project.medias)) {
    project.medias.forEach((media, index) => {
      const mediaUrl = typeof media === 'string' ? media : (media.url || media.image_url || media.file_path || media.file);
      if (mediaUrl) {
        slides.push({
          image: getMediaUrl(mediaUrl),
          title: project.title || 'Медиа',
          description: `Изображение ${index + 1}`
        });
      }
    });
  }

  // 3. Заглушка, если вообще ничего не загружено
  if (slides.length === 0) {
    slides.push({
      image: 'https://placehold.co/1200x600?text=Нет+изображения',
      title: 'Изображение отсутствует',
      description: ''
    });
  }

  // Поля данных формы (поддержка snake_case от бэкенда)
  const practicalBenefit = project.practical_benefit || project.practicalBenefit;
  const implementationDetails = project.implementation_details || project.implementationDetails;
  const results = project.results;

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.subtitle}>
            {project.subtitle ? (
              (() => {
                const parts = project.subtitle.split('·').map((s) => s.trim());
                const first = parts[0];
                const rest = parts.slice(1).join(' · ');
                const authorMatch = /Автор\s*(.+)/i.exec(rest);
                const authorName = authorMatch ? authorMatch[1].trim() : null;

                return (
                  <>
                    <span>{first}</span>
                    {authorName && (
                      <span>
                        {' · '}
                        <button type="button" className={styles.author}>
                          {authorName}
                        </button>
                      </span>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                {project.category?.name && <span>{project.category.name}</span>}
                {project.owner?.name && (
                  <span>
                    {' · Автор: '}
                    <button
                      type="button"
                      className={styles.author}
                      onClick={() => {
                        const userPageState = { page: 'user', projectId: project.id || project._id };
                        window.history.pushState(userPageState, '');
                        const event = new PopStateEvent('popstate', { state: userPageState });
                        window.dispatchEvent(event);
                      }}
                    >
                      {project.owner.name}
                    </button>
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          Назад к списку
        </Button>
      </div>

      {/* Теперь сюда передаётся корректная структура объектов с полем image */}
      <HeroGallery slides={slides} />
      <div className={styles.metaRow}></div>

      {practicalBenefit && (
        <>
          <CategorySection title="Практическая польза" showAction={false} />
          <div className={styles.textContent}>
            <p>{practicalBenefit}</p>
          </div>
        </>
      )}

      {implementationDetails && (
        <>
          <CategorySection title="Специфика реализации" showAction={false} />
          <div className={styles.textContent}>
            <p>{implementationDetails}</p>
          </div>
        </>
      )}

      {results && (
        <>
          <CategorySection title="Результативность" showAction={false} />
          <div className={styles.textContent}>
            <p>{results}</p>
          </div>
        </>
      )}
    </section>
  );
}

export default ProjectPage;