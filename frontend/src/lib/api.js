import { getAuthToken, handleUnauthorized } from '../utils/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let saveQueue = Promise.resolve()

async function request(path, options) {
  const headers = new Headers(options?.headers || {})
  headers.set('Content-Type', 'application/json')
  const token = getAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `API request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.error) message = body.error
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    if (response.status === 401 && token) handleUnauthorized()
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response.json()
}

export const getWorkspace = () => request('/workspace')
export const getTasks = () => request('/tasks')

const queueSave = operation => {
  const save = saveQueue.catch(() => {}).then(() =>
    operation(),
  )

  saveQueue = save
  return save
}

export const saveTasks = tasks =>
  queueSave(() =>
    request('/tasks', {
      method: 'PUT',
      body: JSON.stringify(tasks),
    }),
  )

export const saveWorkspace = workspace =>
  queueSave(() =>
    request('/workspace', {
      method: 'PUT',
      body: JSON.stringify(workspace),
    }),
  )
