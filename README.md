cat << 'EOF' > README.md
# 🚀 Life Dashboard — Productividad & Finanzas Personales

Aplicación web full-stack diseñada como panel integral para la gestión de tareas inmediatas, seguimiento de hábitos diarios y control de finanzas personales con analítica visual en tiempo real.

---

## 🛠️ Stack Tecnológico

- **Backend:** Python 3.12, FastAPI, SQLModel (ORM sobre SQLAlchemy), SQLite.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts.
- **Arquitectura:** API RESTful desacoplada, sincronización concurrente con `Promise.all` y programación defensiva en componentes gráficos.

---

## ✨ Características Principales

1. **Gestión de Foco y Tareas:**
   - CRUD reactivo con persistencia instantánea en base de datos.
   - Alternancia de estado (pendiente/completada) y eliminación sin recargas de página.

2. **Seguimiento de Hábitos & Algoritmo de Rachas:**
   - Modelado relacional 1 a N entre entidades (`Habit` y `HabitLog`) con claves foráneas e integridad referencial.
   - Algoritmo de cómputo temporal para rachas de días consecutivos activos: verificación histórica optimizada mediante conjuntos (`set`) en Python, logrando tiempos de búsqueda promedio $\mathcal{O}(1)$.

3. **Control Financiero & Analítica Visual:**
   - Procesamiento de métricas y KPIs en servidor: cálculo de ingresos, gastos y balance neto.
   - Endpoint analítico (`/analytics/spending-by-category`) para agregación y desglose de gastos por categoría en memoria.
   - Gráfico circular interactivo (*Donut Chart*) construido con **Recharts**, adaptado al diseño en modo oscuro y protegido contra caídas de renderizado (*runtime errors*).

---

## 📂 Estructura del Proyecto

```text
life-dashboard/
├── backend/
│   ├── app/
│   │   ├── database.py       # Configuración del motor SQLite y sesiones
│   │   ├── models.py         # Definición de esquemas SQLModel / Pydantic
│   │   └── main.py           # Endpoints de la API REST y lógica analítica
│   └── requirements.txt      # Dependencias fijadas de Python
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── SpendingChart.tsx  # Componente gráfico con Recharts
    │   ├── App.tsx           # Orquestación de vistas y estados de React
    │   └── main.tsx          # Punto de entrada de la aplicación
    ├── package.json          # Dependencias y scripts de Node.js
    └── tailwind.config.js    # Configuración del sistema de estilos
