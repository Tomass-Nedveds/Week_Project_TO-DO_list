
# Todo App

A to-do list web application built with React, FastAPI, and PostgreSQL.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions

## Features

- User registration and authentication
- Create, edit, and delete tasks
- Track task completion
- Store tasks in PostgreSQL
- Protect user data

## Project Structure

```text
todo-app/
├── frontend/
├── backend/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── compose.yaml
└── README.md
```
## Databse

┌─────────────────────┐
│        users        │
├─────────────────────┤
│ PK id               │
│    username         │
│    email            │
│    password_hash    │
│    created_at       │
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────┐
│        tasks        │
├─────────────────────┤
│ PK id               │
│ FK user_id          │
│    title            │
│    description      │
│    is_completed     │
│    created_at       │
└─────────────────────┘