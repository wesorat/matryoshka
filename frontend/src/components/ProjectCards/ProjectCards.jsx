import styles from './ProjectCards.module.scss';
import { defaultProjects } from '../../data/slides';

function ProjectCards({ projects = defaultProjects, onProjectClick = () => {}, onUserClick = () => {} }) {
  const visibleProjects = projects.slice(0, 4);

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
              <img
                src={project.image}
                alt={project.title}
                className={styles.cardImage}
              />
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardSubtitle}>
                  {(() => {
                    if (!project.subtitle) return null
                    const parts = project.subtitle.split('·').map((s) => s.trim())
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
