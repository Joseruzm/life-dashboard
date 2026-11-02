from sqlmodel import SQLModel, create_engine, Session

from app.models import Task, Habit, HabitLog, Transaction

# Nombre del fichero de la base de datos
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Motor 
engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})

# Fabrica de tablas
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Abrir y cerrar la base de datos
def get_session():
    with Session(engine) as session:
        yield session

