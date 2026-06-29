import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'
import styles from './HomePage.module.scss'

function HomePage({ categories = [], loading = false, projects = [], projectsLoading = false, onCategoryClick, onProjectClick }) {
  const buildCategoryProjects = (categoryId) => projects.filter((project) => project.category?.id === categoryId)
  const topProjects = [...projects]
  .sort((a, b) => b.like_count - a.like_count)
  .slice(0, 5);

  const heroSlides = topProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    image: project.image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/media/uploads/${project.image_url}` : 'https://placehold.co/1920x1080?text=No+Image',
  }));


  return (
    <>
      {heroSlides.length > 0 && <HeroGallery slides={heroSlides} onSlideClick={onProjectClick} />}

      {loading ? (
        <section>
          <p className={styles.emptyText}>Загрузка категорий...</p>
        </section>
      ) : categories.length === 0 ? (
        <section>
          <p className={styles.emptyText}>Категории не найдены.</p>
        </section>
      ) : (
        categories.map((category) => {
          const categoryProjects = buildCategoryProjects(category.id)

          return (
            <section key={category.id}>
              <CategorySection
                title={category.name}
                actionText="Открыть"
                onAction={() => onCategoryClick(category.id)}
                ShowAction={true}
              />
              {projectsLoading ? (
                <p className={styles.emptyText}>Загрузка проектов...</p>
              ) : categoryProjects.length === 0 ? (
                <p className={styles.emptyText}>Проекты не найдены.</p>
              ) : (
                <ProjectCards
                  projects={categoryProjects}
                  limit={4}
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
          )
        })
      )}

      {/* <section>
        <CategorySection title="Все проекты" showAction={false} />
        {projectsLoading ? (
          <p>Загрузка проектов...</p>
        ) : projects.length === 0 ? (
          <p className={styles.emptyText}>Проекты не найдены.</p>
        ) : (
          <ProjectCards projects={projects} onProjectClick={onProjectClick} />
        )}
      </section> */}
    </>
  )
}

export default HomePage
