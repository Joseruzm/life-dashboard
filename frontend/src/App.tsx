import { useState, useEffect } from 'react';
import SpendingChart from './components/SpendingChart';

// --- CONTRATOS DE DATOS (INTERFACES) ---
// Van FUERA del componente porque son solo definiciones de tipos
interface Task {
  id: number;
  title: string;
  is_completed: boolean;
}

interface Habit {
  id: number;
  name: string;
  completed_today: boolean;
  total_completed: number;
  current_streak: number;
}

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  transaction_date: string;
}

interface FinancialSummary {
  total_income: number;
  total_expense: number;
  balance: number;
}

interface CategorySpending {
  name: string;
  value: number;
}

export default function App() {
  // --- ESTADOS (HOOKS) ---
  // Obligatoriamente DENTRO del cuerpo de App()
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });
  const [chartData, setChartData] = useState<CategorySpending[]>([]);

  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Comida');

  const [loading, setLoading] = useState(false);
  const API_URL = 'http://127.0.0.1:8000';

  // --- OBTENCIÓN CONCURRENTE DE DATOS ---
  const fetchData = async () => {
    try {
      const [resTasks, resHabits, resFinances, resChart] = await Promise.all([
        fetch(`${API_URL}/tasks/`),
        fetch(`${API_URL}/habits/`),
        fetch(`${API_URL}/transactions/`),
        fetch(`${API_URL}/analytics/spending-by-category`),
      ]);

      const [dataTasks, dataHabits, dataFinances, dataChart] = await Promise.all([
        resTasks.json(),
        resHabits.json(),
        resFinances.json(),
        resChart.json(),
      ]);

      setTasks(dataTasks);
      setHabits(dataHabits);
      setTransactions(dataFinances.transactions);
      setSummary(dataFinances.summary);
      setChartData(dataChart);
    } catch (error) {
      console.error('Error al sincronizar datos con el backend:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MANEJADORES DE ACCIONES ---
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, is_completed: false }),
      });
      if (res.ok) {
        setNewTaskTitle('');
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    await fetch(`${API_URL}/tasks/${task.id}?is_completed=${!task.is_completed}`, {
      method: 'PATCH',
    });
    fetchData();
  };

  const handleDeleteTask = async (id: number) => {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/habits/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabitName }),
      });
      if (res.ok) {
        setNewHabitName('');
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: number) => {
    await fetch(`${API_URL}/habits/${habitId}/toggle`, { method: 'POST' });
    fetchData();
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: txTitle,
          amount: parsedAmount,
          type: txType,
          category: txCategory,
        }),
      });

      if (res.ok) {
        setTxTitle('');
        setTxAmount('');
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Panel de Vida</h1>
            <p className="text-slate-400 text-sm mt-1">Dashboard integral de productividad, constancia y finanzas</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            ● Backend Conectado
          </span>
        </header>

        {/* SECCIÓN FINANZAS & ANALÍTICA */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>💳</span> Balance & Finanzas Rápidas
          </h2>

          {/* Tarjetas KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Balance Neto</span>
              <p className={`text-2xl font-extrabold mt-1 ${summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.balance.toFixed(2)} €
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Ingresos</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">+{summary.total_income.toFixed(2)} €</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Gastos</span>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">-{summary.total_expense.toFixed(2)} €</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleCreateTransaction} className="grid grid-cols-1 sm:grid-cols-6 gap-3 mb-6">
            <input
              type="text"
              placeholder="Concepto (ej. Café, Nómina)"
              value={txTitle}
              onChange={(e) => setTxTitle(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Importe (€)"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="expense">Gasto (-)</option>
              <option value="income">Ingreso (+)</option>
            </select>
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Comida">Comida</option>
              <option value="Ocio">Ocio</option>
              <option value="Transporte">Transporte</option>
              <option value="Suscripciones">Suscripciones</option>
              <option value="Trabajo">Trabajo</option>
              <option value="Salud">Salud</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Registrar
            </button>
          </form>

          {/* Gráfico y Lista de Transacciones en dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-800/60">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Distribución de Gastos
              </h3>
              <SpendingChart data={chartData} />
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Últimos Movimientos
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <p className="text-slate-500 text-sm italic text-center py-8">No hay transacciones registradas.</p>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {tx.category}
                        </span>
                        <span className="font-medium text-slate-200">{tx.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-slate-500 hover:text-red-400 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* HÁBITOS Y TAREAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Hábitos */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <span>🎯</span> Hábitos diarios
            </h2>
            <p className="text-xs text-slate-400 mb-4">Constancia y rachas históricas</p>

            <form onSubmit={handleCreateHabit} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ej. Leer 20 min, Ejercicio..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Añadir
              </button>
            </form>

            <div className="space-y-2 flex-1">
              {habits.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-6">No tienes hábitos registrados aún.</p>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{habit.name}</p>
                        {habit.current_streak > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap shrink-0">
                            🔥 {habit.current_streak} {habit.current_streak === 1 ? 'día' : 'días'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">Total acumulado: {habit.total_completed} veces</span>
                    </div>
                    <button
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        habit.completed_today
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {habit.completed_today ? '✓ Hecho hoy' : 'Completar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Tareas */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <span>📝</span> Tareas del día
            </h2>
            <p className="text-xs text-slate-400 mb-4">Pendientes inmediatos para hoy</p>

            <form onSubmit={handleCreateTask} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="¿Qué tienes que hacer hoy?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Añadir
              </button>
            </form>

            <div className="space-y-2 flex-1">
              {tasks.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-6">No hay tareas pendientes.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.is_completed}
                        onChange={() => handleToggleTask(task)}
                        className="w-4 h-4 rounded border-slate-700 text-blue-600 cursor-pointer"
                      />
                      <span className={`text-sm ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-500 hover:text-red-400 text-sm px-1 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}