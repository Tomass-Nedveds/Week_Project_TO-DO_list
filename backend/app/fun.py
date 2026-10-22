from pwdlib import PasswordHash

from .database import SessionLocal
from .models import Task, User

hasher = PasswordHash.recommended()


def add_user(username: str, email: str, password: str):
    with SessionLocal() as session:
        try:
            user = session.query(User).filter(
                (User.username == username) | (User.email == email.lower())).first()

            if user:
                print("ERROR: user already exists")
                return False

            obj = User(
                username=username,
                email=email.lower(),
                password_hash=hasher.hash(password)
            )

            session.add(obj)
            session.commit()
            return True

        except Exception as e:
            session.rollback()
            print("DB ERROR add_user:", e)
            return False


def check_user(username: str, password: str):
    with SessionLocal() as session:
        try:
            user = session.query(User).filter(
                (User.username == username) | (User.email == username.lower())
            ).first()

            if user is None:
                print("ERROR: user not found")
                return None

            if not hasher.verify(password, user.password_hash):
                print("ERROR: wrong password")
                return None

            return user

        except Exception as e:
            print("DB ERROR check_user:", e)
            return None


def add_task(user_id: int, title: str, description: str | None = None):
    with SessionLocal() as session:
        try:
            user = session.query(User).filter_by(id=user_id).first()

            if user is None:
                print("ERROR: user not found")
                return False

            obj = Task(
                user_id=user.id,
                title=title.strip(),
                description=description
            )

            session.add(obj)
            session.commit()
            return True

        except Exception as e:
            session.rollback()
            print("DB ERROR add_task:", e)
            return False


def get_user_tasks(user_id: int, is_completed: bool | None = None):
    with SessionLocal() as session:
        query = session.query(Task).filter(Task.user_id == user_id)

        if is_completed is not None:
            query = query.filter(Task.is_completed == is_completed)

        return query.order_by(Task.created_at.desc()).all()


def update_task(user_id: int, task_id: int,
                title: str | None = None, description: str | None = None):
    with SessionLocal() as session:
        try:
            task = session.query(Task).filter_by(id=task_id, user_id=user_id).first()

            if task is None:
                print("ERROR: task not found")
                return False

            if title is not None:
                task.title = title.strip()

            if description is not None:
                task.description = description

            session.commit()
            return True

        except Exception as e:
            session.rollback()
            print("DB ERROR update_task:", e)
            return False


def set_task_done(user_id: int, task_id: int):
    with SessionLocal() as session:
        try:
            task = session.query(Task).filter_by(id=task_id, user_id=user_id).first()

            if task is None:
                print("ERROR: task not found")
                return False

            task.is_completed = True

            session.commit()
            return True

        except Exception as e:
            session.rollback()
            print("DB ERROR set_task_done:", e)
            return False


def delete_task(user_id: int, task_id: int):
    with SessionLocal() as session:
        try:
            task = session.query(Task).filter_by(id=task_id, user_id=user_id).first()

            if task is None:
                print("ERROR: task not found")
                return False

            session.delete(task)
            session.commit()
            return True

        except Exception as e:
            session.rollback()
            print("DB ERROR delete_task:", e)
            return False