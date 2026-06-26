import CategorySection from '../components/CategorySection/CategorySection.jsx';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import styles from './CatPage.module.scss';

function CatPage({ category, projects = [], loading = false, onBack, onProjectClick = () => {} }) {
  if (!category) {
    return (
      <section className={styles.empty}>
        <h1>Категория не найдена</h1>
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
          <h1 className={styles.title}>{category.name}</h1>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          Назад к списку
        </Button>
      </div>

      <CategorySection title={null} showAction={false} />
      {loading ? (
        <section className={styles.loading}>
          <p>Загрузка проектов...</p>
        </section>
      ) : projects.length === 0 ? (
        <section className={styles.emptyList}>
          <p>Проекты в этой категории не найдены.</p>
        </section>
      ) : (
        <ProjectCards
          projects={projects}
          onProjectClick={onProjectClick}
          onUserClick={(projectId) => {
            const userPageState = { page: 'user', projectId };
            window.history.pushState(userPageState, '');
            const event = new PopStateEvent('popstate', { state: userPageState });
            window.dispatchEvent(event);
          }}
        />
      )}
    </section>
  );
}

export default CatPage;
