import { useEffect, useState } from 'react'
import './App.css'

type User = {
  id: number
  username: string
  email: string
}

type ApiTask = {
  id: number
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
}

type Task = {
  id: number
  title: string
  completed: boolean
}

type Filter = 'all' | 'active' | 'completed'
type AuthMode = 'login' | 'register'

const API = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? `Request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('todo-user')
      return saved ? JSON.parse(saved) as User : null
    } catch {
      return null
    }
  })

  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('todo-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('todo-user')
      setTasks([])
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadTasks() {
      setLoading(true)
      setError('')

      try {
        const data = await request<ApiTask[]>(`/tasks?user_id=${user!.id}`)
        if (!cancelled) {
          setTasks(data.map(task => ({
            id: task.id,
            title: task.title,
            completed: task.is_completed,
          })))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load tasks')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadTasks()

    return () => {
      cancelled = true
    }
  }, [user])

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (authMode === 'register') {
        await request<{ status: string }>('/users', {
          method: 'POST',
          body: JSON.stringify({ username, email, password }),
        })
      }

      const loggedInUser = await request<User>('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })

      setUser(loggedInUser)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = input.trim()
    if (!title || !user) return

    setError('')
    setLoading(true)

    try {
      await request<{ status: string }>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          title,
          description: null,
        }),
      })

      const data = await request<ApiTask[]>(`/tasks?user_id=${user.id}`)
      setTasks(data.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.is_completed,
      })))
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add task')
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(task: Task) {
    if (!user) return
    setError('')
    setLoading(true)

    try {
      if (task.completed) {
        setError('The current API can mark tasks as completed, but cannot reopen them yet.')
        return
      }

      await request<{ status: string }>('/tasks/done', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, task_id: task.id }),
      })

      setTasks(current => current.map(item =>
        item.id === task.id ? { ...item, completed: true } : item
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update task')
    } finally {
      setLoading(false)
    }
  }

  async function deleteTask(id: number) {
    if (!user) return
    setError('')
    setLoading(true)

    try {
      await request<{ status: string }>('/tasks/delete', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, task_id: id }),
      })

      setTasks(current => current.filter(task => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete task')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setUser(null)
    setTasks([])
    setPassword('')
    setError('')
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const remainingTasks = tasks.filter(task => !task.completed).length

  if (!user) {
    return (
      <main className="app">
        <h1>To Do List</h1>
        <p className="subtitle">
          {authMode === 'login' ? 'Sign in to see your tasks.' : 'Create your account.'}
        </p>

        <form onSubmit={submitAuth}>
          <input
            value={username}
            onChange={event => setUsername(event.target.value)}
            placeholder="Username or email"
            aria-label="Username or email"
            required
          />

          {authMode === 'register' && (
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Email"
              aria-label="Email"
              required
            />
          )}

          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Password"
            aria-label="Password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Register'}
          </button>
        </form>

        <p>
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            {authMode === 'login' ? 'Create an account' : 'Back to sign in'}
          </button>
        </p>

        {error && <p className="empty" role="alert">{error}</p>}
      </main>
    )
  }

  return (
    <main className="app">
      <h1>To Do List</h1>
      <p className="subtitle">
        Signed in as {user.username}
        {' · '}
        <button type="button" onClick={logout}>Sign out</button>
      </p>

      <form onSubmit={addTask}>
        <input
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="New task..."
          aria-label="New task"
        />
        <button type="submit" disabled={loading}>Add</button>
      </form>

      <nav className="filters" aria-label="Task filters">
        <button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>
          All ({tasks.length})
        </button>
        <button type="button" className={filter === 'active' ? 'selected' : ''} onClick={() => setFilter('active')}>
          Active
        </button>
        <button type="button" className={filter === 'completed' ? 'selected' : ''} onClick={() => setFilter('completed')}>
          Completed
        </button>
      </nav>

      {loading && <p className="empty">Loading...</p>}
      {error && <p className="empty" role="alert">{error}</p>}

      {!loading && filteredTasks.length === 0 ? (
        <p className="empty">
          {tasks.length === 0 ? 'No tasks yet. Add your first task!' : 'No tasks in this filter.'}
        </p>
      ) : (
        <ul>
          {filteredTasks.map(task => (
            <li key={task.id}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => void toggleTask(task)}
                  disabled={loading}
                />
                <span className={task.completed ? 'completed' : ''}>{task.title}</span>
              </label>
              <button
                type="button"
                className="delete-button"
                onClick={() => void deleteTask(task.id)}
                aria-label={`Delete ${task.title}`}
                disabled={loading}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="task-count">Tasks remaining: {remainingTasks}</p>
    </main>
  )
}

export default App