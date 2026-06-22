const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error ${response.status}: ${text || response.statusText}`)
  }

  return response.json()
}

export async function fetchCategories() {
  return handleResponse(await fetch(`${API_URL}/category/`))
}

export async function fetchProjects() {
  return handleResponse(await fetch(`${API_URL}/projects/`))
}

export async function fetchProjectsByCategory(categoryId) {
  return handleResponse(await fetch(`${API_URL}/projects/category/${categoryId}`))
}
