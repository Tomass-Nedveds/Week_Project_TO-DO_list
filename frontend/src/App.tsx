
import { useEffect, useState } from 'react'
import './App.css'

type Task = {
  id: number
  title: string
  completed: boolean
}

type Filter = 'all' | 'active' | 'completed'

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tasks') || '[]')
    } catch {
      return []
    }
  })

  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = input.trim()
    if (!title) return

    setTasks(currentTasks => [
      ...currentTasks,
      {
        id: Date.now(),
        title,
        completed: false,
      },
    ])

    setInput('')
  }

  function toggleTask(id: number) {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    )
  }

  function deleteTask(id: number) {
    setTasks(currentTasks =>
      currentTasks.filter(task => task.id !== id)
    )
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const remainingTasks = tasks.filter(task => !task.completed).length

  return (
    <main className="app">
      <h1>To Do List</h1>
      <p className="subtitle">Keep track of what needs to get done.</p>

      <form onSubmit={addTask}>
        <input
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="New task..."
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>

      <nav className="filters" aria-label="Task filters">
        <button
          type="button"
          className={filter === 'all' ? 'selected' : ''}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </button>

        <button
          type="button"
          className={filter === 'active' ? 'selected' : ''}
          onClick={() => setFilter('active')}
        >
          Active
        </button>

        <button
          type="button"
          className={filter === 'completed' ? 'selected' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </nav>

      {filteredTasks.length === 0 ? (
        <p className="empty">
          {tasks.length === 0
            ? 'No tasks yet. Add your first task!'
            : 'No tasks in this filter.'}
        </p>
      ) : (
        <ul>
          {filteredTasks.map(task => (
            <li key={task.id}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span className={task.completed ? 'completed' : ''}>
                  {task.title}
                </span>
              </label>

              <button
                type="button"
                className="delete-button"
                onClick={() => deleteTask(task.id)}
                aria-label={`Delete ${task.title}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="task-count">
        Tasks remaining: {remainingTasks}
      </p>
    </main>
  )
}

export default App
