import { useState, useEffect } from 'react'
import Button from '../components/Buttons/Button.jsx'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
// ИСПРАВЛЕНО: Импортируем компонент под правильным именем SearchPanel
import SearchPanel from '../components/SearchPanel/SearchPanel.jsx'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import ProjectPage from '../pages/ProjectPage.jsx'
import CatPage from '../pages/CatPage.jsx'
import UserPage from '../pages/UserPage.jsx'
import LogPage from '../pages/LogPage.jsx'
import { fetchCategories, fetchCategoryById, fetchProjects, fetchProjectsByCategory,
         fetchCurrentUser, logout, fetchMyProjects, fetchProjectById, fetchTechnologies,
         fetchUniversities, fetchProjectsFilter } from '../api.js'
import AuthorPage from '../pages/AuthorPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'

const getRouteFromPathname = (pathname = window.location.pathname) => {
  if (/^\/projects\/new\/?$/.test(pathname)) {
    return {
      page: 'projectNew',
      projectId: null,
      categoryId: null,
      logType: null,
    }
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)\/?$/)

  if (projectMatch) {
    return {
      page: 'project',
      projectId: decodeURIComponent(projectMatch[1]),
      categoryId: null,
      logType: null,
    }
  }

  const categoryMatch = pathname.match(/^\/categories\/(\d+)\/?$/)

  if (categoryMatch) {
    return {
      page: 'category',
      projectId: null,
      categoryId: Number(categoryMatch[1]),
      logType: null,
    }
  }

  if (/^\/login\/?$/.test(pathname)) {
    return {
      page: 'log',
      projectId: null,
      categoryId: null,
      logType: 'login',
    }
  }

  if (/^\/register\/?$/.test(pathname)) {
    return {
      page: 'log',
      projectId: null,
      categoryId: null,
      logType: 'signup',
    }
  }

  if (/^\/profile\/?$/.test(pathname)) {
    return {
      page: 'user',
      projectId: null,
      categoryId: null,
      logType: null,
    }
  }

  return {
    page: 'home',
    projectId: null,
    categoryId: null,
    logType: null,
  }
}

const isPlainLeftClick = (event) => (
  !event ||
  (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
)

function App() {
  const initialRoute = getRouteFromPathname()

  // Шапка ======================================================================================================
  const [isShrunk, setIsShrunk] = useState(false) // Уменьшение шапки при скролле
  const [page, setPage] = useState(initialRoute.page) // Имя текущей активной страницы
  const [logType, setLogType] = useState(initialRoute.logType) // Тип окна авторизации (вход или регистрация)
  const [selectedProjectId, setSelectedProjectId] = useState(initialRoute.projectId)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialRoute.categoryId)

  // ИЗМЕНЕНИЕ: Глобальное состояние для текстового поиска по названию проектов
  const [searchQuery, setSearchQuery] = useState('')

  // Текущий пользователь =======================================================================================
  const [user, setUser] = useState(null) // Данные авторизованного юзера
  const [authLoading, setAuthLoading] = useState(true)
  const [myProjects, setMyProjects] = useState([]) // Личные проекты текущего юзера
  const [myProjectsLoading, setMyProjectsLoading] = useState(true)
  const [currentProject, setCurrentProject] = useState(null) // Свежие данные открытого проекта

  // Категории ==================================================================================================
  const [categories, setCategories] = useState([]) //все (в частности драфты)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [homeCategories, setHomeCategories] = useState([]) //только интересные (с проектами)
  const [homeCategoriesLoading, setHomeCategoriesLoading] = useState(true)

  // Технологии =================================================================================================
  const [technologies, setTechnologies] = useState([])
  const [technologiesLoading, setTechnologiesLoading] = useState(true)

  // Вузы (для фильтра поиска) ===================================================================================
  const [universities, setUniversities] = useState([])

  // Фильтр на главной ===========================================================================================
  const [filterUniversityId, setFilterUniversityId] = useState(null)
  const [filterTechnologyIds, setFilterTechnologyIds] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [filteredLoading, setFilteredLoading] = useState(false)

  // Состояния для глобальной ленты всех проектов и страниц категорий ===========================================
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [categoryProjects, setCategoryProjects] = useState([]) // Проекты конкретной категории для CatPage
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [categoryMetaLoading, setCategoryMetaLoading] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false) // Флаг перехода в режим редактирования проекта

  const [selectedAuthorId, setSelectedAuthorId] = useState(null); // ID автора для просмотра его страницы

  //=============================================================================================================

  const applyRoute = (route) => {
    setLogType(route.logType || null)
    setIsEditMode(false)

    if (route.page === 'project') {
      setSelectedCategoryId(null)
      setSelectedAuthorId(null)
      setSelectedProjectId(route.projectId)
      setPage('project')
    } else if (route.page === 'category') {
      setSelectedProjectId(null)
      setSelectedAuthorId(null)
      setSelectedCategoryId(route.categoryId)
      setPage('category')
    } else if (route.page === 'user') {
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setSelectedAuthorId(null)
      setPage('user')
    } else if (route.page === 'projectNew') {
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setSelectedAuthorId(null)
      setPage('projectNew')
    } else if (route.page === 'log') {
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setSelectedAuthorId(null)
      setPage('log')
    } else if (route.page === 'author') {
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setSelectedAuthorId(route.authorId)
      setPage('author')
    } else if (route.page === 'admin') {
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setSelectedAuthorId(null)
      setPage('admin')
    } else {
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setSelectedAuthorId(null)
      setPage('home')
    }
  }

  const navigateToRoute = (path, { replace = false, scrollTop = false } = {}) => {
    const route = getRouteFromPathname(path)
    applyRoute(route)
    const method = replace ? 'replaceState' : 'pushState'
    window.history[method](route, '', path)
    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const route = getRouteFromPathname()
    window.history.replaceState(route, '', window.location.pathname)
  }, [])

  // Проверка сессии при запуске
  useEffect(() => {
    fetchCurrentUser()
      .then((userData) => setUser(userData))
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  // Обработка загрузки проектов юзера
  useEffect(() => {
    if ((page !== 'user' && page !== 'projectNew') || !user) return
    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted) setMyProjectsLoading(true)
    }, 0)
    fetchMyProjects()
      .then((items) => {
        if (mounted) setMyProjects(items)
      })
      .catch((err) => console.error('Не удалось загрузить личные проекты:', err))
      .finally(() => {
        if (mounted) setMyProjectsLoading(false)
      })
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
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
      const route = event.state?.page ? event.state : getRouteFromPathname()
      applyRoute(route)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Загрузка всех категорий без фильтрации (для профиля)
  useEffect(() => {
    let mounted = true
    fetchCategories()
      .then((items) => { if (mounted) setCategories(items) })
      .catch((error) => console.error('Не удалось загрузить все категории:', error))
      .finally(() => { if (mounted) setCategoriesLoading(false) })
    return () => { mounted = false }
  }, [])

  // Загрузка категорий только с проектами (для главной)
  useEffect(() => {
    let mounted = true
    fetchCategories(true)
      .then((items) => { if (mounted) setHomeCategories(items) })
      .catch((error) => console.error('Не удалось загрузить категории для главной:', error))
      .finally(() => { if (mounted) setHomeCategoriesLoading(false) })
    return () => { mounted = false }
  }, [])

  // Загрузка полного списка технологий (для формы создания/редактирования проекта)
  useEffect(() => {
    let mounted = true
    fetchTechnologies()
      .then((items) => { if (mounted) setTechnologies(items) })
      .catch((error) => console.error('Не удалось загрузить технологии:', error))
      .finally(() => { if (mounted) setTechnologiesLoading(false) })
    return () => { mounted = false }
  }, [])

  // Загрузка списка вузов (для фильтра)
  useEffect(() => {
    let mounted = true
    fetchUniversities()
      .then((items) => { if (mounted) setUniversities(items) })
      .catch((error) => console.error('Не удалось загрузить вузы:', error))
    return () => { mounted = false }
  }, [])

  // Признак того, что активен хотя бы один структурный фильтр (категория/вуз/технологии)
  const isFilterActive = Boolean(selectedCategoryId) || Boolean(filterUniversityId) || filterTechnologyIds.length > 0

  // Запрос к /projects/filter/ при изменении фильтров на главной
  useEffect(() => {
    if (page !== 'home' || !isFilterActive) {
      setFilteredProjects([])
      return
    }
    let mounted = true
    setFilteredLoading(true)
    fetchProjectsFilter({
      categoryId: selectedCategoryId || undefined,
      universityId: filterUniversityId || undefined,
      technologyIds: filterTechnologyIds,
    })
      .then((items) => { if (mounted) setFilteredProjects(items) })
      .catch((err) => console.error('Ошибка фильтрации проектов:', err))
      .finally(() => { if (mounted) setFilteredLoading(false) })
    return () => { mounted = false }
  }, [page, selectedCategoryId, filterUniversityId, filterTechnologyIds])

  // Загрузка всех проектов при инициализации страницы
  useEffect(() => {
    let mounted = true
    fetchProjects()
      .then((items) => { if (mounted) setProjects(items) })
      .catch((error) => console.error('Не удалось загрузить проекты:', error))
      .finally(() => { if (mounted) setProjectsLoading(false) })
    return () => { mounted = false }
  }, [])

  // Успешный вход, регистрация ИЛИ редактирование профиля
  const handleAuthSuccess = (userData) => {
    setUser(userData)
    if (page === 'user') {
      navigateToRoute('/profile', { replace: true })
    } else if (page === 'projectNew') {
      navigateToRoute('/projects/new', { replace: true })
    } else if (logType === 'edit') {
      navigateToRoute('/profile', { replace: true })
    } else {
      navigateToRoute('/', { replace: true })
    }
    setLogType(null)
  }

  // Переход в личный кабинет пользователя
  const handleAccountClick = (event) => {
    if (!isPlainLeftClick(event)) return
    event?.preventDefault()
    navigateToRoute('/profile')
  }

  const handleAdminClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('admin')
    window.history.pushState({ page: 'admin' }, '', '/')
  }

  // Полный логаут с очисткой сессии и стейтов
  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Ошибка на бэкенде при логауте:', e)
    } finally {
      setUser(null)
      setMyProjects([])
      navigateToRoute('/')
    }
  }

  // Клик по категории с записью в историю браузера
  const handleCategoryClick = (categoryId, event) => {
    if (!categoryId || !isPlainLeftClick(event)) return

    event?.preventDefault()
    navigateToRoute(`/categories/${categoryId}`, { scrollTop: true })
  }

  // Просмотр отдельного проекта с плавным скроллом наверх
  const handleProjectClick = (projectId, event) => {
    if (!projectId || !isPlainLeftClick(event)) return

    event?.preventDefault()
    setSelectedProjectId(projectId)
    setIsEditMode(false)
    setPage('project')
    navigateToRoute(`/projects/${projectId}`, { scrollTop: true })
  }

  // Кнопка «Назад» с умным возвратом
  const handleBackToHome = () => {
    const nextPage = page === 'project' && user && myProjects.some(p => p.id === selectedProjectId || p._id === selectedProjectId)
      ? '/profile'
      : '/'

    navigateToRoute(nextPage)
  }

  // Открытие формы входа
  const handleLoginClick = (event) => {
    if (!isPlainLeftClick(event)) return
    event?.preventDefault()
    navigateToRoute('/login')
  }

  // Открытие формы регистрации
  const handleSignUpClick = (event) => {
    if (!isPlainLeftClick(event)) return
    event?.preventDefault()
    navigateToRoute('/register')
  }

  // Закрытие окон авторизации
  const handleLogClose = () => {
    navigateToRoute(logType === 'edit' ? '/profile' : '/')
    setLogType(null)
  }

  // Клик на логотип для сброса на Главную страницу
  const handleLogoClick = () => {
    setSearchQuery('') // ИЗМЕНЕНИЕ: Сбрасываем текст поиска при клике на лого
    setSelectedCategoryId(null)
    setFilterUniversityId(null)
    setFilterTechnologyIds([])
    navigateToRoute('/')
  }

  // Переход на страницу другого автора
  const handleAuthorClick = (authorId) => {
    setSelectedAuthorId(authorId);
    setPage('author');
    window.history.pushState({ page: 'author', authorId }, '', '/');
  };

  const handlePublishSuccess = (savedProject) => {
    const projectId = savedProject.id || savedProject._id
    setProjects((prev) => {
      const isExisting = prev.some((proj) => proj.id === projectId || proj._id === projectId)
      if (isExisting) {
        return prev.map((proj) => (proj.id === projectId || proj._id === projectId ? savedProject : proj))
      } else {
        return [savedProject, ...prev]
      }
    })
    setMyProjects((prev) => {
      const isExisting = prev.some((proj) => proj.id === projectId || proj._id === projectId)
      if (isExisting) {
        return prev.map((proj) => (proj.id === projectId || proj._id === projectId ? savedProject : proj))
      } else {
        return [savedProject, ...prev]
      }
    })
  }

  const handleCreateProjectClick = (event) => {
    if (!isPlainLeftClick(event)) return
    event?.preventDefault()
    navigateToRoute('/projects/new')
  }

  const handleCreateProjectClose = () => {
    if (page === 'projectNew') {
      navigateToRoute('/profile', { replace: true })
    }
  }

  const handleAuthGateClose = () => {
    navigateToRoute('/')
  }

  // Получить информацию о проекте по его ID
  useEffect(() => {
    if (!selectedProjectId || page !== 'project') {
      const timeoutId = setTimeout(() => {
        setCurrentProject(null)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted) setCurrentProject(null)
    }, 0)
    fetchProjectById(selectedProjectId)
      .then((data) => {
        if (mounted) setCurrentProject(data)
      })
      .catch((err) => {
        console.error('Не удалось загрузить данные проекта:', err)
        if (mounted) setCurrentProject(null)
      })
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [selectedProjectId, page])

  const selectedCategoryFromList = categories.find((category) => String(category.id || category._id) === String(selectedCategoryId))
  const selectedCategory = selectedCategoryFromList || (selectedCategoryId ? currentCategory : null)

  const displayedCategoryProjects = categoryLoading
    ? []
    : categoryProjects.length > 0
    ? categoryProjects
    : projects.filter((project) => {
        const projCatId = project.category?.id || project.category?._id || project.category_id
        return String(projCatId) === String(selectedCategoryId)
      })

  // Запрос к API для получения проектов внутри выбранной категории
  useEffect(() => {
    if (!selectedCategoryId) {
      const timeoutId = setTimeout(() => {
        setCategoryProjects([])
        setCategoryLoading(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setCategoryProjects([])
        setCategoryLoading(true)
      }
    }, 0)
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
      clearTimeout(timeoutId)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    if (!selectedCategoryId || selectedCategoryFromList) {
      const timeoutId = setTimeout(() => {
        setCurrentCategory(null)
        setCategoryMetaLoading(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted) setCategoryMetaLoading(true)
    }, 0)
    fetchCategoryById(selectedCategoryId)
      .then((item) => {
        if (mounted) setCurrentCategory(item)
      })
      .catch((err) => {
        console.error('Не удалось загрузить категорию:', err)
        if (mounted) setCurrentCategory(null)
      })
      .finally(() => {
        if (mounted) setCategoryMetaLoading(false)
      })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [selectedCategoryId, selectedCategoryFromList])

  // Вспомогательная функция для фильтрации массива проектов по введённому в SearchPanel тексту
  const getFilteredBySearch = (itemsList) => {
  if (!searchQuery) return itemsList
  return itemsList.filter(project =>
    project.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )
}

  const getFilteredCategories = () => {
    // Вместо homeCategories берем полный список categories, если выбран фильтр,
    // и обязательно приводим ID к строке String(), чтобы избежать конфликта типов (число vs строка)
    let filtered = selectedCategoryId
      ? categories.filter(category => String(category.id || category._id) === String(selectedCategoryId))
      : homeCategories

    // 2. Если текстового поиска нет, возвращаем результат текущей фильтрации
    if (!searchQuery) return filtered

    // 3. Если есть текст, дополнительно проверяем наличие подходящих по названию проектов
    const filteredProjects = getFilteredBySearch(projects)
    return filtered.filter(category => {
      const catId = category.id || category._id
      return filteredProjects.some(project => {
        const projCatId = project.category?.id || project.category?._id || project.category_id
        // ИСПРАВЛЕНО: здесь тоже сравниваем строки
        return String(projCatId) === String(catId)
      })
    })
  }

  return (
    <div className="app">
      <header className={isShrunk ? 'appHeader appHeader--shrunk' : 'appHeader'}>
        <div className="appHeader__inner">
          <div className="appHeader__logo" onClick={handleLogoClick}>
            <Logo className={isShrunk ? 'appHeader__logoSvg appHeader__logoSvg--wide' : 'appHeader__logoSvg'} />
          </div>
          <nav className="appHeader__nav">
            {user ? (
              <>
                <Button type="button" variant="link" href="/profile" onClick={handleAccountClick}>
                  {user.name}
                </Button>
                {user.is_superuser && (
                  <Button type="button" variant="link" onClick={handleAdminClick}>
                    Админ
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button type="button" variant="link" href="/register" onClick={handleSignUpClick}>Регистрация</Button>
                <Button type="button" variant="link" href="/login" onClick={handleLoginClick}>Вход</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="appContent">
        {/*
          ИЗМЕНЕНИЕ: Панель поиска размещена здесь.
          Она находится вне условных страниц, поэтому будет видна ВСЕГДА.
        */}
        <SearchPanel
          categories={categories}
          universities={universities}
          technologies={technologies}
          onSearch={(query) => {
            setSearchQuery(query)
            if (query && page !== 'home' && page !== 'category') {
              setPage('home')
              window.history.replaceState({ page: 'home' }, '', '/')
            }
          }}
          onFilterSelect={(catId) => {
            setSelectedCategoryId(catId)
            if (page !== 'home') {
              setPage('home')
              window.history.pushState({ page: 'home' }, '', '/')
            }
          }}
          onUniversityFilterSelect={(uniId) => {
            setFilterUniversityId(uniId)
            if (page !== 'home') {
              setPage('home')
              window.history.pushState({ page: 'home' }, '', '/')
            }
          }}
          onTechnologyFilterSelect={(techIds) => {
            setFilterTechnologyIds(techIds)
            if (page !== 'home') {
              setPage('home')
              window.history.pushState({ page: 'home' }, '', '/')
            }
          }}
        />

       {page === 'home' && (
        <HomePage
          categories={getFilteredCategories()}
          loading={homeCategoriesLoading}
          projects={getFilteredBySearch(projects)}
          projectsLoading={projectsLoading}
          onCategoryClick={handleCategoryClick}
          onProjectClick={handleProjectClick}
          searchQuery={searchQuery}
          selectedCategoryId={selectedCategoryId}
          isFilterActive={isFilterActive}
          flatProjects={getFilteredBySearch(filteredProjects)}
          flatLoading={filteredLoading}
        />
      )}
        {page === 'category' && (
          <CatPage
            category={selectedCategory}
            // Передаем отфильтрованные поиском проекты конкретной категории
            projects={getFilteredBySearch(displayedCategoryProjects)}
            loading={categoryLoading || categoryMetaLoading || categoriesLoading}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
          />
        )}
        {(page === 'user' || page === 'projectNew') && user && (
          <UserPage
            user={user}
            onUserUpdate={setUser}
            projects={myProjects}
            loading={myProjectsLoading}
            categories={categories}
            technologies={technologies}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
            onCreateProjectClick={handleCreateProjectClick}
            createProjectOpen={page === 'projectNew'}
            onCreateProjectClose={handleCreateProjectClose}
            onLogout={handleLogout}
            onPublishSuccess={handlePublishSuccess}
          />
        )}
        {(page === 'user' || page === 'projectNew') && !user && !authLoading && (
          <LogPage type="login" user={user} onBack={handleAuthGateClose} onSuccess={handleAuthSuccess} />
        )}
        {(page === 'user' || page === 'projectNew') && !user && authLoading && (
          <section>
            <p>Проверяем сессию...</p>
          </section>
        )}
        {page === 'author' && (
          <AuthorPage
            userId={selectedAuthorId}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'log' && (
          <LogPage type={logType} user={user} onBack={handleLogClose} onSuccess={handleAuthSuccess} />
        )}
        {page === 'project' && (
          <ProjectPage
            project={currentProject}
            projectId={selectedProjectId}
            editMode={isEditMode}
            onBack={handleBackToHome}
            user={user}
            onAuthorClick={handleAuthorClick}
            onUserPageClick={handleAccountClick}
            categories={categories}
            technologies={technologies}
          />
        )}
          {page === 'admin' && user?.is_superuser && (
            <AdminPage onBack={handleBackToHome} />
          )}

      </main>

      <Footer />
    </div>
  )
}

export default App