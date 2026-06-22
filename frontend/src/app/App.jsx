import { useState, useEffect } from 'react'
import Button from '../components/Buttons/Button.jsx'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import ProjectPage from '../pages/ProjectPage.jsx'
import CatPage from '../pages/CatPage.jsx'
import UserPage from '../pages/UserPage.jsx'
import { defaultProjects } from '../data/slides'
import { fetchCategories, fetchProjectsByCategory } from '../api.js'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)
  const [page, setPage] = useState('home')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryProjects, setCategoryProjects] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(false)

  useEffect(() => {
    let ticking = false
    const threshold = 40      // было 20 — слишком мало, любой "рваный" скролл пересекал границу
    const hysteresis = 10     // было 8 — зона нечувствительности увеличена

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
    //
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

  useEffect(() => {
    let mounted = true

    fetchCategories()
      .then((items) => {
        if (mounted) {
          setCategories(items)
        }
      })
      .catch((error) => {
        console.error('Не удалось загрузить категории:', error)
      })
      .finally(() => {
        if (mounted) {
          setCategoriesLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])
  //Переключение на выбранную категорию через кнопку "еще"
  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedProjectId(null)
    setPage('category')
    window.history.pushState({ page: 'category', categoryId }, '')
  }
  //Переключение на выбранный проект из карточек
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

  // переход на страницу пользователя по projectId (демонстрация)
  useEffect(() => {
    const handleUserOpen = (state) => {
      if (state?.page === 'user') {
        // в реальном приложении здесь мы бы нашли автора по projectId
        setPage('user')
      }
    }

    // слушаем popstate, уже установлен в другом effect, но здесь дополнительная обработка
    const onPop = (e) => handleUserOpen(e.state)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  //Переключение на главную через лого в шапке
  const handleLogoClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('home')
    window.history.pushState({ page: 'home' }, '')
  }

  const selectedProject = null

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  )

  const sampleUser = { name: 'Иван Иванов', avatar: 'https://placehold.co/160x160?text=I' }
  const userProjects = defaultProjects.filter((p) => [1, 2].includes(p.id))

  useEffect(() => {
    if (!selectedCategoryId) {
      setCategoryProjects([])
      return
    }

    let mounted = true
    setCategoryLoading(true)

    fetchProjectsByCategory(selectedCategoryId)
      .then((items) => {
        if (mounted) setCategoryProjects(items)
      })
      .catch((err) => console.error('Ошибка загрузки проектов по категории', err))
      .finally(() => {
        if (mounted) setCategoryLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [selectedCategoryId])

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
            categories={categories}
            loading={categoriesLoading}
            onCategoryClick={handleCategoryClick}
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
        {page === 'user' && (
          <UserPage user={sampleUser} projects={userProjects} onBack={handleBackToHome} onProjectClick={handleProjectClick} />
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
