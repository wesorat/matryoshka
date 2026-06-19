import styles from './ProjectCards.module.scss';
import { defaultProjects } from '../../data/slides';

function ProjectCards({ projects = defaultProjects }) {
  const visibleProjects = projects.slice(0, 4);

  return (
    <section className={styles.section}>
      <div className={styles.cardList}>
        {visibleProjects.map((project) => (
          <article key={project.id} className={styles.card}>
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
    </section>
  );
}

export default ProjectCards;
