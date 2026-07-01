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
import { defaultProjects } from '../data/slides'
import { fetchCategories, fetchProjects, fetchProjectsByCategory,
         fetchCurrentUser, logout, fetchMyProjects, createProject,
         updateProject, fetchProjectById, uploadUserAvatar } from '../api.js'
import AuthorPage from '../pages/AuthorPage.jsx'

function App() {
  // Шапка ======================================================================================================
  const [isShrunk, setIsShrunk] = useState(false) // Уменьшение шапки при скролле
  const [page, setPage] = useState('home') // Имя текущей активной страницы
  const [logType, setLogType] = useState(null) // Тип окна авторизации (вход или регистрация)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  // ИЗМЕНЕНИЕ: Глобальное состояние для текстового поиска по названию проектов
  const [searchQuery, setSearchQuery] = useState('')

  // Текущий пользователь =======================================================================================
  const [user, setUser] = useState(null) // Данные авторизованного юзера
  const [myProjects, setMyProjects] = useState([]) // Личные проекты текущего юзера
  const [myProjectsLoading, setMyProjectsLoading] = useState(true)
  const [currentProject, setCurrentProject] = useState(null) // Свежие данные открытого проекта
  const [currentProjectLoading, setCurrentProjectLoading] = useState(false)

  // Категории ==================================================================================================
  const [categories, setCategories] = useState([]) //все (в частности драфты) 
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [homeCategories, setHomeCategories] = useState([]) //только интересные (с проектами)
  const [homeCategoriesLoading, setHomeCategoriesLoading] = useState(true)

  // Состояния для глобальной ленты всех проектов и страниц категорий ===========================================
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [categoryProjects, setCategoryProjects] = useState([]) // Проекты конкретной категории для CatPage
  const [categoryLoading, setCategoryLoading] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false) // Флаг перехода в режим редактирования проекта

  const [selectedAuthorId, setSelectedAuthorId] = useState(null); // ID автора для просмотра его страницы

  //=============================================================================================================
  
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
      } else if (event.state?.page === 'author') {
        setSelectedAuthorId(event.state.authorId);
        setPage('author');
      } else {
        setSelectedProjectId(null)
        setSelectedCategoryId(null)
        setPage('home')
      }
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
    if (logType === 'edit') {
      setPage('user')
    } else {
      setPage('home')
    }
    setLogType(null)
  }

  // Переход в личный кабинет пользователя
  const handleAccountClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setPage('user')
    window.history.pushState({ page: 'user' }, '')
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
      setSelectedProjectId(null)
      setSelectedCategoryId(null)
      setPage('home')
      window.history.pushState({ page: 'home' }, '')
    }
  }

  // Клик по категории с записью в историю браузера
  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedProjectId(null)
    setPage('category')
    window.history.pushState({ page: 'category', categoryId }, '')
  }

  // Просмотр отдельного проекта с плавным скроллом наверх
  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId)
    setIsEditMode(false)
    setPage('project')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState({ page: 'project', projectId }, '')
  }

  // Открытие проекта сразу в режиме редактирования (из личного кабинета)
  const handleEditProjectClick = (project) => {
    const projectId = project.id || project._id
    setSelectedProjectId(projectId)
    setIsEditMode(true)
    setPage('project')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState({ page: 'project', projectId }, '')
  }

  // Кнопка «Назад» с умным возвратом
  const handleBackToHome = () => {
    if (page === 'project' && user && myProjects.some(p => p.id === selectedProjectId || p._id === selectedProjectId)) {
      setPage('user')
    } else {
      setPage('home')
    }
    setSelectedProjectId(null)
    setIsEditMode(false)
  }

  // Открытие формы входа
  const handleLoginClick = () => {
    setPage('log')
    setLogType('login')
  }

  // Открытие формы регистрации
  const handleSignUpClick = () => {
    setPage('log')
    setLogType('signup')
  }

  // Закрытие окон авторизации
  const handleLogClose = () => {
    setPage(logType === 'edit' ? 'user' : 'home')
    setLogType(null)
  }

  // Дополнительный слушатель для корректного отслеживания возврата в профиль
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

  // Клик на логотип для сброса на Главную страницу
  const handleLogoClick = () => {
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setSearchQuery('') // ИЗМЕНЕНИЕ: Сбрасываем текст поиска при клике на лого
    setPage('home')
    window.history.pushState({ page: 'home' }, '')
  }

  // Переход на страницу другого автора
  const handleAuthorClick = (authorId) => {
    setSelectedAuthorId(authorId);
    setPage('author');
    window.history.pushState({ page: 'author', authorId }, '');
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

  // Получить информацию о проекте по его ID
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

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId)

  const displayedCategoryProjects = categoryLoading
    ? []
    : categoryProjects.length > 0
    ? categoryProjects
    : projects.filter((project) => project.category_id === selectedCategoryId)

  // Запрос к API для получения проектов внутри выбранной категории
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

  // Вспомогательная функция для фильтрации массива проектов по введённому в SearchPanel тексту
  const getFilteredBySearch = (itemsList) => {
    if (!searchQuery) return itemsList
    return itemsList.filter(project => 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
        {/* 
          ИЗМЕНЕНИЕ: Панель поиска размещена здесь. 
          Она находится вне условных страниц, поэтому будет видна ВСЕГДА.
        */}
        <SearchPanel 
          categories={categories}
          onSearch={(query) => {
            setSearchQuery(query)
            // Умное поведение: если пользователь находится внутри страницы просмотра отдельного проекта,
            // личного кабинета или окна авторизации и начинает что-то писать в глобальный поиск — 
            // автоматически перенаправляем его на главную страницу каталога для отображения результатов.
            if (query && page !== 'home' && page !== 'category') {
              setPage('home')
            }
          }}
          onFilterSelect={(catId) => {
            if (catId) {
              handleCategoryClick(catId) // Переключаемся на страницу выбранной категории
            } else {
              handleLogoClick() // Если фильтр сброшен, возвращаем на главную
            }
          }}
        />

        {page === 'home' && (
          <HomePage
            categories={homeCategories}
            loading={homeCategoriesLoading}
            // Передаем отфильтрованные поиском проекты
            projects={getFilteredBySearch(projects)}
            projectsLoading={projectsLoading}
            onCategoryClick={handleCategoryClick}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'category' && (
          <CatPage
            category={selectedCategory}
            // Передаем отфильтрованные поиском проекты конкретной категории
            projects={getFilteredBySearch(displayedCategoryProjects)}
            loading={categoryLoading}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
          />
        )}
        {page === 'user' && user && (
          <UserPage
            user={user}
            onUserUpdate={setUser}
            projects={myProjects}
            loading={myProjectsLoading}
            categories={categories}
            onBack={handleBackToHome}
            onProjectClick={handleProjectClick}
            onLogout={handleLogout}
            onPublishSuccess={handlePublishSuccess}
          />
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
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App