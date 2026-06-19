import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'

function HomePage() {
  return (
    <>
      <HeroGallery />
      <CategorySection />
      <ProjectCards />
      <CategorySection />
      <ProjectCards />
      <CategorySection />
      <ProjectCards />
    </>
  )
}

export default HomePage
