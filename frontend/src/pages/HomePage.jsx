import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'

function HomePage({ onProjectClick }) {
  return (
    <>
      <HeroGallery />
      <CategorySection />
      <ProjectCards onProjectClick={onProjectClick} />
      <CategorySection />
      <ProjectCards onProjectClick={onProjectClick} />
      <CategorySection />
      <ProjectCards onProjectClick={onProjectClick} />
    </>
  )
}

export default HomePage
