import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx';
import CategorySection from '../components/CategorySection/CategorySection.jsx';
import Button from '../components/Buttons/Button.jsx';
import styles from './ProjectPage.module.scss';
import { fetchProjectById } from '../api.js'
import { useState, useEffect } from 'react'


function ProjectPage({ project: initialProject, projectId, onBack }) {
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState('');

  useEffect(() => {
    // Определяем ID проекта из пропсов
    const id = projectId || initialProject?.id || initialProject?._id;

    // Если у нас нет проекта, или в нем отсутствуют детальные поля, делаем запрос к бэкенду
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

  // Приводим поля к единому знаменателю (бэкенд возвращает snake_case, форма может вернуть camelCase)
  const practicalBenefit = project.practical_benefit || project.practicalBenefit || project.benefit;
  const implementationDetails = project.implementation_details || project.implementationDetails || project.implementation;
  const results = project.results;

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.subtitle}>
            {project.subtitle && (() => {
              const parts = project.subtitle.split('·').map((s) => s.trim());
              const first = parts[0];
              const rest = parts.slice(1).join(' · ');
              const authorMatch = /Автор\s*(.+)/i.exec(rest);
              const authorName = authorMatch ? authorMatch[1].trim() : null;

              return (
                <>
                  <span>{first}</span>
                  {authorName ? (
                    <span>
                      {' · '}
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
                        {authorName}
                      </button>
                    </span>
                  ) : (
                    rest ? <span>{' · ' + rest}</span> : null
                  )}
                </>
              );
            })()}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          Назад к списку
        </Button>
      </div>

      {project.slides && <HeroGallery slides={project.slides} />}
      <div className={styles.metaRow}></div>

      {/* Выводим новые поля, которые заполняются в форме */}
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