import { useState, useEffect } from 'react'
import Button from '../components/Buttons/Button.jsx'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import Page2 from '../pages/Page2.jsx'
import ProjectPage from '../pages/ProjectPage.jsx'
import { defaultProjects } from '../data/slides'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)
  const [page, setPage] = useState('home')
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  useEffect(() => {
    let ticking = false
    const threshold = 20
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const newState = window.scrollY > threshold
          setIsShrunk(newState)
          ticking = false
        })
        ticking = true
      }
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
        setSelectedProjectId(event.state.projectId)
        setPage('project')
      } else if (event.state?.page === 'page2') {
        setSelectedProjectId(null)
        setPage('page2')
      } else {
        setSelectedProjectId(null)
        setPage('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId)
    setPage('project')
    window.history.pushState({ page: 'project', projectId }, '')
  }

  const handleBackToHome = () => {
    setSelectedProjectId(null)
    setPage('home')
    window.history.pushState({ page: 'home' }, '')
  }

  

  const selectedProject = defaultProjects.find(
    (project) => project.id === selectedProjectId,
  )

  return (
    <>
      <header className={isShrunk ? 'appHeader appHeader--shrunk' : 'appHeader'}>
        <div className="appHeader__inner">
          <div className="appHeader__logo">
            <Logo
              className={isShrunk ?   'appHeader__logoSvg appHeader__logoSvg--wide' : 'appHeader__logoSvg'}
            />
          </div>
          <nav className="appHeader__nav">
            {/* кнопки */}
          </nav>
        </div>
      </header>

      <main className="appContent">
        {page === 'home' && <HomePage onProjectClick={handleProjectClick} />}
        {page === 'page2' && <Page2 />}
        {page === 'project' && (
          <ProjectPage project={selectedProject} onBack={handleBackToHome} />
        )}
      </main>

      <Footer />
    </>
  )
}

export default App
