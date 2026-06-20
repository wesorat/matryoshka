import styles from './ProjectCards.module.scss';
import { defaultProjects } from '../../data/slides';

function ProjectCards({ projects = defaultProjects, onProjectClick = () => {} }) {
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
                <p className={styles.cardSubtitle}>{project.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectCards;
