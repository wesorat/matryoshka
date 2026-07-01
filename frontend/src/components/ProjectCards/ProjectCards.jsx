import styles from './ProjectCards.module.scss';
import { defaultProjects } from '../../data/slides';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const mediaBaseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

function ProjectCards({ 
  projects = defaultProjects, 
  onProjectClick = () => {}, 
  onUserClick = () => {}, 
  onEditClick = null, // Новый проп для обработки редактирования
  limit = null 

}) {

  const visibleProjects = limit ? projects.slice(0, limit) : projects;
  const handleKeyDown = (event, projectId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onProjectClick(projectId);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.cardList}>
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => onProjectClick(project.id)}
              onKeyDown={(event) => handleKeyDown(event, project.id)}
            >
              <div className={styles.cardMedia}>
                {project.image || project.image_url ? (
                  <img
                    src={`${mediaBaseUrl}/media/uploads/${project.image || project.image_url}`}
                    alt={project.title}
                    className={styles.cardImage}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.cardImagePlaceholder} />
                )}
                <span className={styles.cardArrow} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardSubtitle}>
                  {(() => {
                    const subtitleText = project.subtitle || project.description
                    if (!subtitleText) return null
                    const parts = subtitleText.split('·').map((s) => s.trim())
                    const first = parts[0]
                    const rest = parts.slice(1).join(' · ')
                    const authorMatch = /Автор\s*(.+)/i.exec(rest)
                    const authorName = authorMatch ? authorMatch[1].trim() : null
                    return (
                      <>
                        <span>{first}</span>
                        {authorName ? (
                          <span>
                            {' · '}
                            <button
                              type="button"
                              className={styles.author}
                              onClick={(e) => { e.stopPropagation(); onUserClick(project.id); }}
                            >
                              {authorName}
                            </button>
                          </span>
                        ) : (
                          rest ? <span>{' · ' + rest}</span> : null
                        )}
                      </>
                    )
                  })()}
                </p>
              </div>
              {/* Кнопка редактирования (отображается, если передан onEditClick) */}
              {onEditClick && (
                <div 
                  className={styles.cardActions} 
                  onClick={(e) => e.stopPropagation()} // Предотвращаем открытие карточки
                >
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => onEditClick(project)}
                  >
                    Редактировать
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectCards;

