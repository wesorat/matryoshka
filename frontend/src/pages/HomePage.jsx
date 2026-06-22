import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'
import { categories, defaultProjects } from '../data/slides'

function HomePage({ onCategoryClick, onProjectClick }) {
  return (
    <>
      <HeroGallery />
      {categories.map((category) => (
        <section key={category.id}>
          <CategorySection
            title={category.title}
            onAction={() => onCategoryClick(category.id)}
          />
          <ProjectCards
            projects={defaultProjects.filter((project) => category.projectIds.includes(project.id))}
            onProjectClick={onProjectClick}
            onUserClick={(projectId) => {
              // простая демонстрация: переходим на страницу пользователя
              const userPageState = { page: 'user', projectId };
              window.history.pushState(userPageState, '');
              // событие обработается в App через popstate, но мы также можем вызвать напрямую
              const event = new PopStateEvent('popstate', { state: userPageState });
              window.dispatchEvent(event);
            }}
          />
        </section>
      ))}
    </>
  )
}

export default HomePage
