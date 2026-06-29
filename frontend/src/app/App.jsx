import { useState, useEffect } from 'react'
import Button from '../components/Buttons/Button.jsx'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import ProjectPage from '../pages/ProjectPage.jsx'
import CatPage from '../pages/CatPage.jsx'
import UserPage from '../pages/UserPage.jsx'
import LogPage from '../pages/LogPage.jsx'
import { defaultProjects } from '../data/slides'
import { fetchCategories, fetchProjects, fetchProjectsByCategory,
         fetchCurrentUser, logout, fetchMyProjects, createProject,
         updateProject, fetchProjectById } from '../api.js'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)
  const [page, setPage] = useState('home')
  const [logType, setLogType] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  const [user, setUser] = useState(null)
  const [myProjects, setMyProjects] = useState([])
  const [myProjectsLoading, setMyProjectsLoading] = useState(true)
  const [currentProject, setCurrentProject] = useState(null)
  const [currentProjectLoading, setCurrentProjectLoading] = useState(false)

  // 1. Стейт для ВСЕХ категорий (нужен для профиля и поиска по ID)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Новые стейты: категории ТОЛЬКО С ПРОЕКТАМИ для Главной страницы
  const [homeCategories, setHomeCategories] = useState([])
  const [homeCategoriesLoading, setHomeCategoriesLoading] = useState(true)

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [categoryProjects, setCategoryProjects] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)

  // Проверка сессии при запуске
  useEffect(() => {
    fetchCurrentUser()
      .then((userData) => setUser(userData))
      .catch(() => {
        setUser(null)
      })
  }, [])

  // Обработка загрузки проектов юзера
  useEffect(() => {
    if (page !== 'user' || !user) return

    let mounted = true
    setMyProjectsLoading(true)

    fetchMyProjects()
      .then((items) => {
        if (mounted) setMyProjects(items)
      })
      .catch((err) => console.error('Не удалось загрузить личные проекты:', err))
      .finally(() => {
        if (mounted) setMyProjectsLoading(false)
      })

    return () => { mounted = false }
  }, [page, user])

  // Обработка скролла шапки
  useEffect(() => {
    let ticking = false
    const threshold = 40
    const hysteresis = 10

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

    return () => { window.removeEventListener('scroll', handleScroll) }
  }, [])

  // История браузера
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
      } else if (event.state?.page === 'user') {
        setPage('user')
      } else {
        setSelectedProjectId(null)
        setSelectedCategoryId(null)
        setPage('home')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Эффект А: Загрузка вообще ВСЕХ категорий без фильтрации (для UserPage)
  useEffect(() => {
    let mounted = true
    fetchCategories()
      .then((items) => { if (mounted) setCategories(items) })
      .catch((error) => console.error('Не удалось загрузить все категории:', error))
      .finally(() => { if (mounted) setCategoriesLoading(false) })
    return () => { mounted = false }
  }, [])

  // Эффект Б: Загрузка категорий только с проектами (для HomePage)
  useEffect(() => {
    let mounted = true
    // Передаем true, как ты и настроил на бэкенде
    fetchCategories(true)
      .then((items) => { if (mounted) setHomeCategories(items) })
      .catch((error) => console.error('Не удалось загрузить категории для главной:', error))
      .finally(() => { if (mounted) setHomeCategoriesLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    fetchProjects()
      .then((items) => { if (mounted) setProjects(items) })
      .catch((error) => console.error('Не удалось загрузить проекты:', error))
      .finally(() => { if (mounted) setProjectsLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setPage('home')
    setLogType(null)
  }

  const handleAccountClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('user')
    window.history.pushState({ page: 'user' }, '')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Ошибка на бэкенде при логауте:', e)
    } finally {
      setUser(null)
      setMyProjects([])
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setPage('home')
      window.history.pushState({ page: 'home' }, '')
    }
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedProjectId(null)
    setPage('category')
    window.history.pushState({ page: 'category', categoryId }, '')
  }

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId)
    setIsEditMode(false)
    setPage('project')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState({ page: 'project', projectId }, '')
  }

  const handleEditProjectClick = (project) => {
    const projectId = project.id || project._id
    setSelectedProjectId(projectId)
    setIsEditMode(true)
    setPage('project')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState({ page: 'project', projectId }, '')
  }

  const handleBackToHome = () => {
    if (page === 'project' && user && myProjects.some(p => p.id === selectedProjectId || p._id === selectedProjectId)) {
      setPage('user')
    } else {
      setPage('home')
    }
    setSelectedProjectId(null)
    setIsEditMode(false)
  }

  const handleLoginClick = () => {
    setPage('log')
    setLogType('login')
  }

  const handleSignUpClick = () => {
    setPage('log')
    setLogType('signup')
  }

  const handleLogClose = () => {
    setPage('home')
    setLogType(null)
  }

  useEffect(() => {
    const handleUserOpen = (state) => {
      if (state?.page === 'user') {
        setPage('user')
      }
    }
    const onPop = (e) => handleUserOpen(e.state)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const handleLogoClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('home')
    window.history.pushState({ page: 'home' }, '')
  }

  const handlePublishSuccess = (savedProject) => {
  const projectId = savedProject.id || savedProject._id

  // 1. Обновляем общий список проектов
  setProjects((prev) => {
    const isExisting = prev.some((proj) => proj.id === projectId || proj._id === projectId)
    if (isExisting) {
      return prev.map((proj) => (proj.id === projectId || proj._id === projectId ? savedProject : proj))
    } else {
      return [savedProject, ...prev]
    }
  })

  // 2. Обновляем список личных проектов пользователя
  setMyProjects((prev) => {
    const isExisting = prev.some((proj) => proj.id === projectId || proj._id === projectId)
    if (isExisting) {
      return prev.map((proj) => (proj.id === projectId || proj._id === projectId ? savedProject : proj))
    } else {
      return [savedProject, ...prev]
    }
  })
  console.log('Стейт проектов успешно синхронизирован с сервером')}

  useEffect(() => {
  if (!selectedProjectId || page !== 'project') {
    setCurrentProject(null)
    return
  }

  let mounted = true
  setCurrentProjectLoading(true)

  fetchProjectById(selectedProjectId)
    .then((data) => {
      if (mounted) setCurrentProject(data)
    })
    .catch((err) => {
      console.error('Не удалось загрузить данные проекта:', err)
    })
    .finally(() => {
      if (mounted) setCurrentProjectLoading(false)
    })

  return () => { mounted = false }
}, [selectedProjectId, page])

  // Поиск выбранной категории оставляем по полному списку categories,
  // чтобы страница категории CatPage открывалась корректно в любом случае
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId)

  const displayedCategoryProjects = categoryLoading
    ? []
    : categoryProjects.length > 0
    ? categoryProjects
    : projects.filter((project) => project.category_id === selectedCategoryId)

  useEffect(() => {
    if (!selectedCategoryId) return

    let mounted = true
    setTimeout(() => {
      if (mounted) setCategoryLoading(true)
    }, 0)

    fetchProjectsByCategory(selectedCategoryId)
      .then((items) => {
        if (mounted) setCategoryProjects(items)
      })
      .catch((err) => console.error('Ошибка загрузки проектов по категории', err))
      .finally(() => {
        if (mounted) setCategoryLoading(false)
      })

    return () => { mounted = false }
  }, [selectedCategoryId])

  return (
    <div className="app">
      <header className={isShrunk ? 'appHeader appHeader--shrunk' : 'appHeader'}>
        <div className="appHeader__inner">
          <div className="appHeader__logo" onClick={handleLogoClick}>
            <Logo className={isShrunk ? 'appHeader__logoSvg appHeader__logoSvg--wide' : 'appHeader__logoSvg'} />
          </div>
          <nav className="appHeader__nav">
            {user ? (
              <Button type="button" variant="link" onClick={handleAccountClick}>
                {user.name}
              </Button>
            ) : (
              <>
                <Button type="button" variant="link" onClick={handleSignUpClick}>Регистрация</Button>
                <Button type="button" variant="link" onClick={handleLoginClick}>Вход</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="appContent">
        {page === 'home' && (
          <HomePage
            // Передаем отфильтрованные категории на главную страницу
            categories={homeCategories}
            loading={homeCategoriesLoading}
            projects={projects}
            projectsLoading={projectsLoading}
            onCategoryClick={handleCategoryClick}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'category' && (
          <CatPage
            category={selectedCategory}
            projects={displayedCategoryProjects}
            loading={categoryLoading}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'user' && user && (
          <UserPage
            user={user}
            projects={myProjects}
            loading={myProjectsLoading}
            // Передаем полный список категорий, чтобы можно было выбрать любую при создании/редактировании
            categories={categories}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
            onLogout={handleLogout}
            onPublishSuccess={handlePublishSuccess}
          />
        )}
        {page === 'log' && (
          <LogPage type={logType} onBack={handleLogClose} onSuccess={handleAuthSuccess} />
        )}
        {page === 'project' && (
          <ProjectPage
            project={currentProject}
            projectId={selectedProjectId}
            editMode={isEditMode}
            onBack={handleBackToHome}
            user={user}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App