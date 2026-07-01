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
  const getProjectId = (project) => project.id || project._id;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.cardList}>
          {visibleProjects.map((project) => {
            const projectId = getProjectId(project);
            const projectUrl = projectId ? `/projects/${projectId}` : '#';

            return (
            <article
              key={projectId}
              className={styles.card}
            >
              <a
                href={projectUrl}
                className={styles.cardLink}
                onClick={(event) => onProjectClick(projectId, event)}
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
                      return (
                        <>
                          <span>{first}</span>
                          {rest ? <span>{' · ' + rest}</span> : null}
                        </>
                      )
                    })()}
                  </p>
                </div>
              </a>
              {/* Кнопка редактирования (отображается, если передан onEditClick) */}
              {onEditClick && (
                <div 
                  className={styles.cardActions}
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
            )
          })}
        </div>
      </div>
    </section>
  );
}

export default ProjectCards;
