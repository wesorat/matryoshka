import { useState, useEffect } from 'react'
import Button from '../components/Buttons/Button.jsx'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import ProjectPage from '../pages/ProjectPage.jsx'
import CatPage from '../pages/CatPage.jsx'
import { defaultProjects, categories } from '../data/slides'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)
  const [page, setPage] = useState('home')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  useEffect(() => {
    let ticking = false
    const threshold = 800      // было 20 — слишком мало, любой "рваный" скролл пересекал границу
    const hysteresis = 100     // было 8 — зона нечувствительности увеличена

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const currentScroll = window.scrollY
        setIsShrunk((prevShrunk) => {
          if (prevShrunk && currentScroll < threshold - hysteresis) return false
          if (!prevShrunk && currentScroll > threshold) return true
          return prevShrunk
        })
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.page === 'project') {
        setSelectedCategoryId(null)
        setSelectedProjectId(event.state.projectId)
        setPage('project')
      } else if (event.state?.page === 'category') {
        setSelectedProjectId(null)
        setSelectedCategoryId(event.state.categoryId)
        setPage('category')
      } else {
        setSelectedProjectId(null)
        setSelectedCategoryId(null)
        setPage('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedProjectId(null)
    setPage('category')
    window.history.pushState({ page: 'category', categoryId }, '')
  }

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId)
    setPage('project')
    window.history.pushState({ page: 'project', projectId }, '')
  }

  const handleBackToHome = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('home')
    window.history.pushState({ page: 'home' }, '')
  }

  const handleLogoClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('home')
    window.history.pushState({ page: 'home' }, '')
  }

  const selectedProject = defaultProjects.find(
    (project) => project.id === selectedProjectId,
  )

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  )

  const categoryProjects = selectedCategory
    ? defaultProjects.filter((project) => selectedCategory.projectIds.includes(project.id))
    : []

  return (
    <>
      <header className={isShrunk ? 'appHeader appHeader--shrunk' : 'appHeader'}>
        <div className="appHeader__inner">
          <div className="appHeader__logo" onClick={handleLogoClick}>
            <Logo
              className={isShrunk ? 'appHeader__logoSvg appHeader__logoSvg--wide' : 'appHeader__logoSvg'}
            />
          </div>
          <nav className="appHeader__nav">
            {/* кнопки */}
          </nav>
        </div>
      </header>

      <main className="appContent">
        {page === 'home' && (
          <HomePage
            onCategoryClick={handleCategoryClick}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'category' && (
          <CatPage
            category={selectedCategory}
            projects={categoryProjects}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'project' && (
          <ProjectPage project={selectedProject} onBack={handleBackToHome} />
        )}
      </main>

      <Footer />
    </>
  )
}

export default App
