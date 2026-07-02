const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      // Если не JSON, пробуем как текст
      const text = await response.text();
      errorDetail = text || errorDetail;
    }
    throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
  }

  // Для 204 No Content
  if (response.status === 204) return null;

  return response.json()
}

// Базовые параметры для fetch (чтобы ходили куки)
const fetchOptions = (options = {}) => ({
  ...options,
  credentials: 'omit', // Для публичных методов можно оставить omit или 'same-origin', но для Auth нужно 'include'
})

const authFetchOptions = (options = {}) => ({
  ...options,
  credentials: 'include',
})

export async function fetchCategories(have_project = false) {
  const url = have_project
    ? `${API_URL}/category/?has_projects=true`
    : `${API_URL}/category/`

  return handleResponse(await fetch(url, fetchOptions()))
}

export async function fetchCategoryById(categoryId) {
  return handleResponse(await fetch(`${API_URL}/category/${categoryId}`, fetchOptions()))
}

export async function fetchProjects() {
  return handleResponse(await fetch(`${API_URL}/projects/`, fetchOptions()))
}

export async function fetchProjectById(projectId) {
  return handleResponse(await fetch(`${API_URL}/projects/${projectId}`, authFetchOptions()))
}

export async function fetchProjectsByCategory(categoryId) {
  return handleResponse(await fetch(`${API_URL}/projects/category/${categoryId}`, fetchOptions()))
}

// --- Новые методы для авторизации ---

export async function login(email, password) {
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
  return handleResponse(
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        university_id: Number(universityId)
      }),
    })
  )
}


export async function fetchMyProjects() {
  return handleResponse(
    await fetch(`${API_URL}/projects/my`, {
      method: 'GET',
      credentials: 'include',
    })
  )
}

export async function logout() {
  return handleResponse(
    await fetch(`${API_URL}/auth/jwt/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  )
}

export async function fetchCurrentUser() {
  return handleResponse(
    await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      credentials: 'include',
    })
  )
}

export async function createProject(projectData) {
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

  // Отправляем новые текстовые поля
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
      method: 'PATCH', // <-- ИСПРАВЛЕНО: заменено с 'PUT' на 'PATCH'
      credentials: 'include',
      body: formData,
    })
  )
}

export async function fetchProjectsByUser(userId) {
  return handleResponse(await fetch(`${API_URL}/projects/users/${userId}`, fetchOptions()))
}

export async function deleteProject(projectId) {
  return handleResponse(
    await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  )
}

export async function fetchUniversities() {
  return handleResponse(await fetch(`${API_URL}/university/`, fetchOptions()))
}

// --- Технологии ---

export async function fetchTechnologies(count = 300) {
  return handleResponse(await fetch(`${API_URL}/technology/?count=${count}`, fetchOptions()))
}

export async function addProjectTechnology(projectId, technologyId) {
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
  return handleResponse(
    await fetch(`${API_URL}/technology/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, technology_id: technologyId }),
    })
  )
}

export async function createLike(projectId) {
  return handleResponse(await fetch(`${API_URL}/likes/?project_id=${projectId}`, {
    method: 'POST',
    credentials: 'include',
  }))
}

export async function deleteLike(projectId) {
  return handleResponse(await fetch(`${API_URL}/likes/?project_id=${projectId}`, {
    method: 'DELETE',
    credentials: 'include',
  }))
}

export async function createComment(projectId, text) {
  return handleResponse(await fetch(`${API_URL}/comments/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, text }),
  }))
}

export async function deleteComment(commentId) {
  return handleResponse(await fetch(`${API_URL}/comments/?comment_id=${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  }))
}

export async function updateCurrentUser(userData) {
  return handleResponse(
    await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
    })
  )
}

export async function uploadUserAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  return handleResponse(
    await fetch(`${API_URL}/users/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  );
}

export async function createMedia(projectId, file, view = 'image') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('view', view) // 'image' | 'video'
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
  return handleResponse(
    await fetch(`${API_URL}/media/?project_id=${projectId}&media_id=${mediaId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  )
}

// --- Admin ---

export async function fetchAdminUsers() {
  return handleResponse(
    await fetch(`${API_URL}/admin/users/`, { credentials: 'include' })
  )
}

export async function fetchAdminProjects(count = 1000) {
  return handleResponse(
    await fetch(`${API_URL}/admin/projects/?count=${count}`, { credentials: 'include' })
  )
}

export async function fetchAdminComments(count = 1000) {
  return handleResponse(
    await fetch(`${API_URL}/admin/comments?count=${count}`, { credentials: 'include' })
  )
}

export async function searchUsersByName(name) {
  return handleResponse(
    await fetch(`${API_URL}/users/search/${encodeURIComponent(name)}`, fetchOptions())
  )
}

export async function searchProjectsByTitle(title) {
  return handleResponse(
    await fetch(`${API_URL}/projects/search/${encodeURIComponent(title)}`, fetchOptions())
  )
}

export async function searchCommentsByText(text) {
  // В бэке path-параметр {name} не используется, но обязателен — дублируем text и туда
  return handleResponse(
    await fetch(
      `${API_URL}/comments/search/${encodeURIComponent(text)}?text=${encodeURIComponent(text)}`,
      fetchOptions()
    )
  )
}

export async function deleteUserAdmin(userId) {
  return handleResponse(
    await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  )
}