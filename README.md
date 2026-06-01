# Distribuidora Rodríguez-Carrión

Sistema interno de gestión para distribuidora de materiales de construcción. Permite administrar productos, proformas, recibos, compras, facturas importadas de eFacilito y reportes.

---

## Tecnologías

- **Backend:** Node.js, Express, PostgreSQL, JWT, Nodemailer
- **Frontend:** React + Vite, React Router

---

## Requisitos previos

Antes de clonar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior
- Git

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/distribuidora_rc.git
cd distribuidora_rc
```

### 2. Configurar la base de datos

Abre pgAdmin o psql y ejecuta los siguientes pasos:

**Crear el usuario y la base de datos:**
```sql
CREATE USER user_dist WITH PASSWORD 'user12345';
CREATE DATABASE distribuidora_rc OWNER user_dist;
```

**Crear las tablas (desde la raíz del proyecto):**
```bash
psql -U user_dist -d distribuidora_rc -f schema.sql
```

O si usas pgAdmin: abre la base de datos `distribuidora_rc`, ve a la herramienta de Query y ejecuta el contenido del archivo `schema.sql`.

El usuario administrador por defecto es:
- **Usuario:** `admin`
- **Contraseña:** `password`

> Cámbiala desde la gestión de usuarios una vez que ingreses.

### 3. Configurar el backend

```bash
cd backend
```

Crea el archivo `.env` copiando el ejemplo:
```bash
cp .env.example .env
```

Edita `.env` con tus valores (ver sección [Variables de entorno](#variables-de-entorno)).

Instala las dependencias:
```bash
npm install
```

### 4. Configurar el frontend

```bash
cd ../frontend
npm install
```

---

## Levantar el proyecto

Necesitas dos terminales abiertas al mismo tiempo.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
El servidor corre en `http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
La aplicación abre en `http://localhost:5173`

---

## Variables de entorno

El archivo `.env` va dentro de la carpeta `backend/`. Copia `.env.example` y completa cada valor:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT (pon cualquier texto largo) |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token (ej: `8h`) |
| `PORT` | Puerto del backend (por defecto `3001`) |
| `NODE_ENV` | Entorno (`development` o `production`) |
| `FRONTEND_URL` | URL del frontend para CORS (por defecto `http://localhost:5173`) |
| `EMAIL_USER` | Cuenta Gmail desde la que se envían los emails de recuperación |
| `EMAIL_PASS` | Contraseña de aplicación de Gmail (no la contraseña normal) |

### Cómo obtener el EMAIL_PASS de Gmail

Para que el sistema pueda enviar emails de recuperación de contraseña necesitas una **Contraseña de aplicación** de Google, no tu contraseña normal:

1. Entra a [myaccount.google.com](https://myaccount.google.com)
2. Ve a **Seguridad**
3. Activa la **Verificación en 2 pasos** si no la tienes
4. Busca **Contraseñas de aplicación**
5. Escribe un nombre (ej: `distribuidora`) y haz clic en **Crear**
6. Google te muestra una clave de 16 letras — cópiala tal cual en `EMAIL_PASS`

> Si no configuras el email, el sistema funciona normalmente pero la función de recuperar contraseña no enviará correos.

---

## Estructura del proyecto

```
distribuidora_rc/
├── schema.sql                  # Esquema completo de la base de datos
├── backend/
│   ├── .env.example            # Plantilla de variables de entorno
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── index.js            # Entrada del servidor
│       ├── config/db.js        # Conexión a PostgreSQL
│       ├── controllers/        # Lógica de negocio
│       ├── middleware/auth.js  # Verificación JWT
│       └── routes/index.js     # Definición de rutas
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx             # Rutas de la aplicación
        ├── api/config.js       # Configuración de Axios
        ├── context/            # AuthContext
        ├── components/         # Layout principal
        └── pages/              # Vistas por módulo
```

---

## Funcionalidades

- **Login** con JWT y recuperación de contraseña por email
- **Dashboard** con resumen de ventas y stock
- **Productos** con control de inventario y ajuste de stock
- **Documentos** — proformas y recibos con conversión entre tipos
- **Compras** con entrada automática de stock
- **Facturas eFacilito** — importación desde Excel
- **Reportes** de ventas, productos y movimientos de stock
- **Usuarios** con roles `admin` y `bodeguero`