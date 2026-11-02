from datetime import date
from typing import Optional
from sqlmodel import SQLModel, Field

# Modulo 1 : TAREAS
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    is_completed: bool = False

# Modulo 2 : HÁBITOS
class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

class HabitLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # foreign_key = "habit.id" es la union de esta fila con la tabla de hábitos
    habit_id: int = Field(foreign_key="habit.id", index=True)
    completed_date: date = Field(default_factory=date.today)

# Modulo 3 : Finanzas
class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    amount: float
    type: str  # "income" o "expense" (gasto o ingreso)
    category: str
    transaction_date: date = Field(default_factory=date.today)