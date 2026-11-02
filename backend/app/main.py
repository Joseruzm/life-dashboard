from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from contextlib import asynccontextmanager
from datetime import date, timedelta
from collections import defaultdict

from app.database import create_db_and_tables, get_session
from app.models import Task, Habit, HabitLog, Transaction

def calculate_streak(completed_dates: list[date]) -> int:
    """
    Calcula la racha actual de días consecutivos.
    Complejidad temporal: O(N) para crear el set, O(K) para recorrer la racha (K <= N).
    """
    if not completed_dates:
        return 0

    # Convertimos la lista a un set para búsquedas en tiempo constante O(1)
    dates_set = set(completed_dates)
    today = date.today()
    yesterday = today - timedelta(days=1)

    # Determinamos el punto de inicio de la comprobación
    if today in dates_set:
        current_day = today
    elif yesterday in dates_set:
        current_day = yesterday
    else:
        # Si no se completó ni hoy ni ayer, la racha activa es 0
        return 0

    streak = 0
    # Retrocedemos día a día mientras la fecha esté presente en el conjunto
    while current_day in dates_set:
        streak += 1
        current_day -= timedelta(days=1)

    return streak

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="Life Dashboard API",
    description="API para gestión de hábitos, tareas y finanzas",
    version="0.1.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Obtener todas las tareas
@app.get("/tasks/", response_model=list[Task], tags=["Tareas"])
@app.get("/tasks", response_model=list[Task], include_in_schema=False)
def read_tasks(session: Session = Depends(get_session)):
    tasks = session.exec(select(Task)).all()
    return tasks

# 2. Crear una tarea
@app.post("/tasks/", response_model=Task, tags=["Tareas"])
@app.post("/tasks", response_model=Task, include_in_schema=False)
def create_task(task: Task, session: Session = Depends(get_session)):
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

# 3. Modificar estado (PATCH)
@app.patch("/tasks/{task_id}", response_model=Task, tags=["Tareas"])
@app.patch("/tasks/{task_id}/", response_model=Task, include_in_schema=False)
def update_task(task_id: int, is_completed: bool, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    task.is_completed = is_completed
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

# 4. Eliminar tarea (DELETE)
@app.delete("/tasks/{task_id}", tags=["Tareas"])
@app.delete("/tasks/{task_id}/", tags=["Tareas"], include_in_schema=False)
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    session.delete(task)
    session.commit()
    return {"message": "Tarea eliminada correctamente"}


# HABITOS
# 1. Crear un nuevo hábito
@app.post("/habits/", response_model=Habit, tags=["Hábitos"])
def create_habit(habit: Habit, session: Session = Depends(get_session)):
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit

# 2. Listar todos los hábitos con un indicador de si se completó hoy
@app.get("/habits/", tags=["Hábitos"])
def read_habits(session: Session = Depends(get_session)):
    today = date.today()
    habits = session.exec(select(Habit)).all()
    
    result = []
    for habit in habits:
        # Obtenemos todos los registros de este hábito
        logs = session.exec(
            select(HabitLog).where(HabitLog.habit_id == habit.id)
        ).all()
        
        # Extraemos solo las fechas completadas
        completed_dates = [log.completed_date for log in logs]
        
        # Comprobamos si está completado hoy
        completed_today = today in completed_dates
        
        # Calculamos la racha consecutiva usando nuestra función
        current_streak = calculate_streak(completed_dates)

        result.append({
            "id": habit.id,
            "name": habit.name,
            "completed_today": completed_today,
            "total_completed": len(logs),
            "current_streak": current_streak  # <-- Nuevo campo devuelto
        })
        
    return result

# 3. Alternar cumplimiento de hoy (si no estaba hecho lo marca, si ya estaba lo desmarca)
@app.post("/habits/{habit_id}/toggle", tags=["Hábitos"])
def toggle_habit_today(habit_id: int, session: Session = Depends(get_session)):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")

    today = date.today()
    log = session.exec(
        select(HabitLog).where(
            HabitLog.habit_id == habit_id,
            HabitLog.completed_date == today
        )
    ).first()

    if log:
        # Si ya lo había completado hoy, lo borramos (desmarcar)
        session.delete(log)
        session.commit()
        return {"status": "uncompleted", "message": "Hábito desmarcado para hoy"}
    else:
        # Si no existía, creamos el registro para la fecha de hoy
        new_log = HabitLog(habit_id=habit_id, completed_date=today)
        session.add(new_log)
        session.commit()
        return {"status": "completed", "message": "Hábito completado hoy"}


# FINANZAS
# 1. Registrar una nueva transacción (ingreso o gasto)
@app.post("/transactions/", response_model=Transaction, tags=["Finanzas"])
def create_transaction(transaction: Transaction, session: Session = Depends(get_session)):
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

# 2. Listar las transacciones y devolver el resumen calculado
@app.get("/transactions/", tags=["Finanzas"])
def get_transactions(session: Session = Depends(get_session)):
    # Obtenemos todas las transacciones ordenadas por ID descendente (las más recientes primero)
    transactions = session.exec(select(Transaction).order_by(Transaction.id.desc())).all()

    # Calculamos totales en el backend
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = total_income - total_expense

    return {
        "summary": {
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "balance": round(balance, 2),
        },
        "transactions": transactions
    }

# 3. Eliminar una transacción
@app.delete("/transactions/{transaction_id}", tags=["Finanzas"])
def delete_transaction(transaction_id: int, session: Session = Depends(get_session)):
    tx = session.get(Transaction, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    session.delete(tx)
    session.commit()
    return {"message": "Transacción eliminada"}


# DASHBOARDS
@app.get("/analytics/spending-by-category", tags=["Analítica"])
def get_spending_by_category(session: Session = Depends(get_session)):
    """
    Agrupa todos los gastos por categoría y calcula el total por cada una.
    """
    # Obtenemos únicamente las transacciones de tipo gasto
    expenses = session.exec(
        select(Transaction).where(Transaction.type == "expense")
    ).all()

    # Agrupamos sumando por categoría
    category_totals = defaultdict(float)
    for exp in expenses:
        category_totals[exp.category] += exp.amount

    # Formateamos los datos con la estructura exacta que exige Recharts:
    # [{"name": "Comida", "value": 25.5}, ...]
    chart_data = [
        {"name": category, "value": round(total, 2)}
        for category, total in category_totals.items()
    ]

    return chart_data