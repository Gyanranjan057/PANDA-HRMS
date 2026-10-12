const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let saveQueue = Promise.resolve()

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let message = `API request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.error) message = body.error
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message)
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
