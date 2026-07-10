const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

//=======================================================================================
//                      Базовые HTTP-хелперы
//=======================================================================================

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = response.statusText
    try {
      const errorData = await response.json()
      errorDetail = errorData.detail || errorDetail
    } catch {
      const text = await response.text()
      errorDetail = text || errorDetail
    }
    throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail))
  }

  if (response.status === 204) return null

  return response.json()
}

// Базовые параметры для публичных запросов.
const fetchOptions = (options = {}) => ({
  ...options,
  credentials: 'omit',
})

// Базовые параметры для запросов, которым нужен доступ к cookie/сессии.
const authFetchOptions = (options = {}) => ({
  ...options,
  credentials: 'include',
})

//=======================================================================================
//                    Категории и публичные данные
//=======================================================================================

export async function fetchCategories(have_project = false) {
  // Получает список категорий. Если передан флаг, возвращает только те, у которых есть проекты.
  const url = have_project
    ? `${API_URL}/category/?has_projects=true`
    : `${API_URL}/category/`

  return handleResponse(await fetch(url, fetchOptions()))
}

export async function fetchCategoryById(categoryId) {
  // Получает одну категорию по её id.
  return handleResponse(await fetch(`${API_URL}/category/${categoryId}`, fetchOptions()))
}

export async function fetchProjects() {
  // Возвращает список всех публичных проектов.
  return handleResponse(await fetch(`${API_URL}/projects/`, fetchOptions()))
}

export async function fetchProjectById(projectId) {
  // Возвращает подробную информацию об одном проекте.
  return handleResponse(await fetch(`${API_URL}/projects/${projectId}`, authFetchOptions()))
}

export async function fetchProjectsByCategory(categoryId) {
  // Возвращает проекты конкретной категории.
  return handleResponse(await fetch(`${API_URL}/projects/category/${categoryId}`, fetchOptions()))
}

export async function fetchUniversities() {
  // Получает список университетов для формы создания и редактирования проекта.
  return handleResponse(await fetch(`${API_URL}/university/`, fetchOptions()))
}

//=======================================================================================
//                      Авторизация и профиль
//=======================================================================================

export async function login(email, password) {
  // Выполняет вход по email/password и сохраняет сессию через cookie.
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  return handleResponse(await fetch(`${API_URL}/auth/jwt/login`, authFetchOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
    credentials: 'include',
  })))
}

export async function register(email, password, name, universityId) {
  // Создаёт нового пользователя.
  return handleResponse(
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        university_id: Number(universityId),
      }),
    })
  )
}

export async function logout() {
  // Завершает текущую авторизованную сессию.
  return handleResponse(
    await fetch(`${API_URL}/auth/jwt/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  )
}

export async function fetchCurrentUser() {
  // Возвращает данные авторизованного пользователя.
  return handleResponse(
    await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      credentials: 'include',
    })
  )
}

export async function updateCurrentUser(userData) {
  // Обновляет профиль текущего пользователя.
  return handleResponse(
    await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
  )
}

export async function uploadUserAvatar(file) {
  // Загружает аватарку текущего пользователя.
  const formData = new FormData()
  formData.append('file', file)

  return handleResponse(
    await fetch(`${API_URL}/users/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  )
}

//=======================================================================================
//                    Управление проектами
//=======================================================================================

export async function fetchMyProjects() {
  // Возвращает проекты текущего авторизованного пользователя.
  return handleResponse(
    await fetch(`${API_URL}/projects/my`, {
      method: 'GET',
      credentials: 'include',
    })
  )
}

export async function fetchProjectsByUser(userId) {
  // Возвращает проекты конкретного пользователя.
  return handleResponse(await fetch(`${API_URL}/projects/users/${userId}`, fetchOptions()))
}

export async function createProject(projectData) {
  // Создаёт новый проект от имени текущего пользователя.
  const formData = new FormData()

  formData.append('title', projectData.title)
  formData.append('description', projectData.description || '')
  if (projectData.status) {
    formData.append('status', projectData.status)
  }
  if (projectData.categoryId) {
    formData.append('category_id', projectData.categoryId)
  }
  if (projectData.universityId) {
    formData.append('university_id', projectData.universityId)
  }

  formData.append('practical_benefit', projectData.practicalBenefit || '')
  formData.append('implementation_details', projectData.implementationDetails || '')
  formData.append('results', projectData.results || '')

  if (projectData.media) {
    formData.append('file', projectData.media)
  }

  return handleResponse(
    await fetch(`${API_URL}/projects/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  )
}

export async function updateProject(projectId, projectData) {
  // Обновляет существующий проект.
  const formData = new FormData()

  formData.append('title', projectData.title)
  formData.append('description', projectData.description || '')
  if (projectData.status) {
    formData.append('status', projectData.status)
  }
  if (projectData.categoryId) {
    formData.append('category_id', projectData.categoryId)
  }
  if (projectData.universityId) {
    formData.append('university_id', projectData.universityId)
  }

  formData.append('practical_benefit', projectData.practicalBenefit || '')
  formData.append('implementation_details', projectData.implementationDetails || '')
  formData.append('results', projectData.results || '')

  if (projectData.media) {
    formData.append('file', projectData.media)
  }

  return handleResponse(
    await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    })
  )
}

export async function deleteProject(projectId) {
  // Удаляет проект по его id.
  return handleResponse(
    await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  )
}

//=======================================================================================
//                    Технологии проекта
//=======================================================================================

export async function fetchTechnologies(count = 300) {
  // Получает список доступных технологий.
  return handleResponse(await fetch(`${API_URL}/technology/?count=${count}`, fetchOptions()))
}

export async function addProjectTechnology(projectId, technologyId) {
  // Привязывает одну технологию к проекту.
  return handleResponse(
    await fetch(`${API_URL}/technology/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, technology_id: technologyId }),
    })
  )
}

export async function removeProjectTechnology(projectId, technologyId) {
  // Отвязывает одну технологию от проекта.
  return handleResponse(
    await fetch(`${API_URL}/technology/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, technology_id: technologyId }),
    })
  )
}

export async function addProjectTechnologies(projectId, technologyIds) {
  // Привязывает сразу несколько технологий к проекту.
  return handleResponse(
    await fetch(`${API_URL}/technology/all?project_id=${projectId}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(technologyIds.map(Number)),
    })
  )
}

export async function removeProjectTechnologies(projectId, technologyIds) {
  // Отвязывает сразу несколько технологий от проекта.
  return handleResponse(
    await fetch(`${API_URL}/technology/all?project_id=${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(technologyIds.map(Number)),
    })
  )
}

//=======================================================================================
//               Лайки, комментарии и медиа
//=======================================================================================

export async function createLike(projectId) {
  // Ставит лайк проекту.
  return handleResponse(await fetch(`${API_URL}/likes/?project_id=${projectId}`, {
    method: 'POST',
    credentials: 'include',
  }))
}

export async function deleteLike(projectId) {
  // Убирает лайк с проекта.
  return handleResponse(await fetch(`${API_URL}/likes/?project_id=${projectId}`, {
    method: 'DELETE',
    credentials: 'include',
  }))
}

export async function createComment(projectId, text) {
  // Добавляет комментарий к проекту.
  return handleResponse(await fetch(`${API_URL}/comments/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, text }),
  }))
}

export async function deleteComment(commentId) {
  // Удаляет комментарий по его id.
  return handleResponse(await fetch(`${API_URL}/comments/?comment_id=${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  }))
}

export async function createMedia(projectId, file, view = 'image') {
  // Загружает медиа-файл для проекта.
  const formData = new FormData()
  formData.append('file', file)
  formData.append('view', view)
  formData.append('project_id', projectId)

  return handleResponse(
    await fetch(`${API_URL}/media/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  )
}

export async function deleteMedia(projectId, mediaId) {
  // Удаляет медиа-файл проекта.
  return handleResponse(
    await fetch(`${API_URL}/media/?project_id=${projectId}&media_id=${mediaId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  )
}

//=======================================================================================
//                      Администрирование
//=======================================================================================

export async function fetchAdminUsers() {
  // Получает список пользователей для панели администратора.
  return handleResponse(
    await fetch(`${API_URL}/admin/users/`, { credentials: 'include' })
  )
}

export async function fetchAdminProjects(count = 1000) {
  // Получает список проектов для панели администратора.
  return handleResponse(
    await fetch(`${API_URL}/admin/projects/?count=${count}`, { credentials: 'include' })
  )
}

export async function fetchAdminComments(count = 1000) {
  // Получает список комментариев для панели администратора.
  return handleResponse(
    await fetch(`${API_URL}/admin/comments?count=${count}`, { credentials: 'include' })
  )
}

export async function deleteUserAdmin(userId) {
  // Удаляет пользователя из-под администратора.
  return handleResponse(
    await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  )
}

//=======================================================================================
//                    Поиск и фильтрация
//=======================================================================================

export async function searchUsersByName(name) {
  // Ищет пользователей по имени.
  return handleResponse(
    await fetch(`${API_URL}/users/search/${encodeURIComponent(name)}`, fetchOptions())
  )
}

export async function searchProjectsByTitle(title) {
  // Ищет проекты по названию.
  return handleResponse(
    await fetch(`${API_URL}/projects/search/${encodeURIComponent(title)}`, fetchOptions())
  )
}

export async function searchCommentsByText(text) {
  // Ищет комментарии по тексту.
  return handleResponse(
    await fetch(
      `${API_URL}/comments/search/${encodeURIComponent(text)}?text=${encodeURIComponent(text)}`,
      fetchOptions()
    )
  )
}

export async function fetchProjectsFilter({ universityId, categoryId, technologyIds } = {}) {
  // Возвращает проекты по фильтрам университета, категории и технологий.
  const params = new URLSearchParams()
  if (universityId) params.append('university_id', universityId)
  if (categoryId) params.append('category_id', categoryId)
  if (technologyIds && technologyIds.length > 0) {
    technologyIds.forEach((id) => params.append('technologies', id))
  }
  const query = params.toString()
  return handleResponse(
    await fetch(`${API_URL}/projects/filter/${query ? '?' + query : ''}`, fetchOptions())
  )
}