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

export async function fetchCategories(hasProjects = false) {
  // Если передан true, добавляем к URL параметр фильтрации (например, ?has_projects=true)
  // Убедись, что имя параметра (has_projects) совпадает с тем, как ты назвал его на бэкенде!
  const url = hasProjects 
    ? `${API_URL}/category/?has_projects=true` 
    : `${API_URL}/category/`

  return handleResponse(await fetch(url, fetchOptions()))
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

export async function register(email, password, name) {
  return handleResponse(
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
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