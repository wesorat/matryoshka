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

export async function fetchCategories() {
  return handleResponse(await fetch(`${API_URL}/category/`, fetchOptions()))
}

export async function fetchProjects() {
  return handleResponse(await fetch(`${API_URL}/projects/`, fetchOptions()))
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
  })))
}

export async function register(email, password, name) {
  return handleResponse(await fetch(`${API_URL}/auth/register`, fetchOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })))
}

export async function fetchCurrentUser() {
  return handleResponse(await fetch(`${API_URL}/users/me`, authFetchOptions()))
}

export async function logout() {
  return handleResponse(await fetch(`${API_URL}/auth/jwt/logout`, authFetchOptions({
    method: 'POST',
  })))
}