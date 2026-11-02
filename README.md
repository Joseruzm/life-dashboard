# 🚀 Life Dashboard — Productividad & Finanzas Personales

Aplicación web full-stack diseñada como panel integral de productividad personal, seguimiento de hábitos y control de finanzas con analítica visual en tiempo real.

---

## 🛠️ Stack Tecnológico

- **Backend:** Python 3.12, FastAPI, SQLModel (ORM sobre SQLAlchemy), SQLite.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts.
- **Arquitectura:** API RESTful desacoplada, sincronización concurrente con `Promise.all` y renderizado defensivo de gráficos vectoriales.

---

## ✨ Características Principales

1. **Gestión de Foco y Tareas:** CRUD reactivo con alternancia de estado y persistencia inmediata.
2. **Seguimiento de Hábitos & Algoritmo de Rachas:** 
   - Relación 1 a N entre entidades (`Habit` y `HabitLog`).
   - Algoritmo de cálculo de rachas consecutivas activas optimizado mediante conjuntos (`set`) en memoria con complejidad de búsqueda $\mathcal{O}(1)$.
3. **Control Financiero & Analítica Visual:**
   - Cálculo dinámico de balance neto, ingresos y gastos.
   - Endpoint analítico para agregación de consumos por categoría.
   - Gráfico circular interactivo y adaptable con **Recharts**.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone [https://github.com/TU_USUARIO/life-dashboard.git](https://github.com/TU_USUARIO/life-dashboard.git)
cd life-dashboard
