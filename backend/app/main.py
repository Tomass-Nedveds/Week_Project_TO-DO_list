#from fastapi import FastAPI

#app = FastAPI(
#    title="Todo API",
#    version="0.1.0",
#    docs_url="/api/docs",
#    openapi_url="/api/openapi.json",
#)


#@app.get("/api/health")
#def health_check() -> dict[str, str]:
#    return {"status": "ok"}


from contextlib import asynccontextmanager

from fastapi import Body, FastAPI, HTTPException

from . import fun
from .init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Todo API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


#users

@app.post("/api/users")
def create_user(
    username: str = Body(),
    email: str = Body(),
    password: str = Body(),
):
    if not crud.add_user(username, email, password):
        raise HTTPException(status_code=400, detail="User already exists")
    return {"status": "user added"}


@app.post("/api/login")
def login(
    username: str = Body(),
    password: str = Body(),
):
    user = crud.check_user(username, password)
    if user is None:
        raise HTTPException(status_code=401, detail="Wrong username or password")
    return {"id": user.id, "username": user.username, "email": user.email}


# ---------- tasks ----------

@app.get("/api/tasks")
def get_tasks(user_id: int, is_completed: bool | None = None):
    tasks = crud.get_user_tasks(user_id, is_completed)
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "is_completed": t.is_completed,
            "created_at": t.created_at,
        }
        for t in tasks
    ]


@app.post("/api/tasks")
def create_task(
    user_id: int = Body(),
    title: str = Body(),
    description: str | None = Body(None),
):
    if not crud.add_task(user_id, title, description):
        raise HTTPException(status_code=400, detail="Failed to create task")
    return {"status": "task created"}


@app.post("/api/tasks/update")
def update_task(
    user_id: int = Body(),
    task_id: int = Body(),
    title: str | None = Body(None),
    description: str | None = Body(None),
):
    if not crud.update_task(user_id, task_id, title, description):
        raise HTTPException(status_code=400, detail="Failed to update task")
    return {"status": "task updated"}


@app.post("/api/tasks/done")
def task_done(
    user_id: int = Body(),
    task_id: int = Body(),
):
    if not crud.set_task_done(user_id, task_id):
        raise HTTPException(status_code=400, detail="Failed to update task")
    return {"status": "task marked as done"}


@app.post("/api/tasks/delete")
def task_delete(
    user_id: int = Body(),
    task_id: int = Body(),
):
    if not crud.delete_task(user_id, task_id):
        raise HTTPException(status_code=400, detail="Failed to delete task")
    return {"status": "task deleted"}