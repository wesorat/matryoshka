import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx';
import CategorySection from '../components/CategorySection/CategorySection.jsx';
import Button from '../components/Buttons/Button.jsx';
import styles from './ProjectPage.module.scss';

function ProjectPage({ project, onBack }) {
  if (!project) {
    return (
      <section className={styles.empty}>
        <h1>Проект не найден</h1>
        <Button type="button" variant="outline" onClick={onBack}>
          Вернуться
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.subtitle}>{project.subtitle}</p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          Назад к списку
        </Button>
      </div>

      <HeroGallery slides={project.slides} />

      <CategorySection title="Практическая польза" showAction={false} />
      <div className={styles.textContent}>
        <p>{project.benefit}</p>
      </div>

      <CategorySection title="Специфика реализации" showAction={false} />
      <div className={styles.textContent}>
        <p>{project.implementation}</p>
      </div>

      <CategorySection title="Результативность" showAction={false} />
      <div className={styles.textContent}>
        <p>{project.results}</p>
      </div>
    </section>
  );
}

export default ProjectPage;
