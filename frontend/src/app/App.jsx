import { useState, useEffect } from 'react'
import './App.scss'
import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsShrunk(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <>
      <header className={isShrunk ? 'appHeader appHeader--shrunk' : 'appHeader'}>
        <div className="appHeader__inner">
          <img src="/logo.svg" alt="Матрешка" className="appHeader__logo" />
        </div>
      </header>

      <main className="appContent">
        <HeroGallery />
        <CategorySection />
        <ProjectCards />
        <CategorySection />
        <ProjectCards />
        <CategorySection />
        <ProjectCards />
      </main>
    </>
  )
}

export default App
