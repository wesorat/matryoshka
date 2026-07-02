import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'
import styles from './HomePage.module.scss'

// ИСПРАВЛЕНО: принимаем selectedCategoryId из пропсов
function HomePage({
  categories = [],
  loading = false,
  projects = [],
  projectsLoading = false,
  onCategoryClick,
  onProjectClick,
  searchQuery = '',
  selectedCategoryId = null, // ДОБАВЛЕНО
  isFilterActive = false,
  flatProjects = [],
  flatLoading = false,
}) {

  // Функция фильтрации проектов внутри категории
  const buildCategoryProjects = (categoryId) =>
    projects.filter((project) => {
      const projCatId = project.category?.id || project.category?._id || project.category_id
      return String(projCatId) === String(categoryId)
    })

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
      {/* ИСПРАВЛЕНО: Галерея скрывается, если есть поисковый запрос ИЛИ выбрана категория */}
      {!searchQuery && !isFilterActive && heroSlides.length > 0 && (
        <HeroGallery slides={heroSlides} onSlideClick={onProjectClick} />
      )}

      {isFilterActive ? (
        flatLoading ? (
          <p className={styles.emptyText}>Загрузка проектов...</p>
        ) : flatProjects.length === 0 ? (
          <p className={styles.emptyText}>Проекты не найдены.</p>
        ) : (
          <ProjectCards projects={flatProjects} onProjectClick={onProjectClick} />
        )
      ) : loading ? (
        <section>
          <p className={styles.emptyText}>Загрузка категорий...</p>
        </section>
      ) : categories.length === 0 ? (
        <section>
          <p className={styles.emptyText}>Категории не найдены.</p>
        </section>
      ) : (
        categories.map((category) => {
          const catId = category.id || category._id // Подстраховка для разных видов ID
          const categoryProjects = buildCategoryProjects(catId)

          return (
            <section key={catId} className={styles.categoryBlock}>
              <CategorySection
                title={category.name}
                actionText="Открыть"
                actionHref={`/categories/${catId}`}
                onAction={(event) => onCategoryClick(catId, event)}
                showAction={true}
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
    </>
  )
}

export default HomePage
