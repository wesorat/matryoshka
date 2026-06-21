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
          />
        </section>
      ))}
    </>
  )
}

export default HomePage
