import styles from './ProjectCards.module.scss';
import { defaultProjects } from '../../data/slides';

function ProjectCards({ projects = defaultProjects, onProjectClick = () => {}, onUserClick = () => {}, limit = null }) {
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
              {project.image || project.image_url ? (
              <img
                src={"/media/uploads/" + (project.image || project.image_url)}
                alt={project.title}
                className={styles.cardImage}
              />
            ) : (
              <div className={styles.cardImagePlaceholder} />
            )}
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardSubtitle}>
                  {(() => {
                    const subtitleText = project.subtitle || project.description
                    if (!subtitleText) return null
                    const parts = subtitleText.split('·').map((s) => s.trim())
                    const first = parts[0]
                    const rest = parts.slice(1).join(' · ')
                    // пытаемся найти имя автора в оставшейся части
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectCards;
