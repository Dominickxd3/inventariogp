# InventarioGP

Sistema de inventario patrimonial para gestión de equipos, componentes, trabajadores, asignaciones e incidencias.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Base de datos | SQL Server |
| Autenticación | JWT (jsonwebtoken) |
| Validación | Zod |
| Seguridad | Helmet, CORS, express-rate-limit |

## Requisitos

- Node.js 22+
- SQL Server 2019+ (o Azure SQL)
- npm 10+

## Estructura del proyecto

```
inventariogp/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuración (DB, JWT, CORS)
│   │   ├── middleware/     # Auth, validación, rate limiting, errores
│   │   ├── repositories/  # Capa de datos (SQL directo)
│   │   ├── routes/        # Definición de rutas Express
│   │   ├── services/      # Lógica de negocio
│   │   └── index.js       # Punto de entrada
│   ├── migrations/        # Scripts SQL de migración
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # AuthContext (autenticación)
│   │   ├── lib/           # Cliente API
│   │   ├── pages/         # Páginas/vistas
│   │   └── App.jsx        # Router principal
│   ├── .env.example
│   └── package.json
└── README.md
```

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/Dominickxd3/inventariogp.git
cd inventariogp

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

## Configuración

### Backend

Copia `backend/.env.example` como `backend/.env` y completa los valores:

```env
PORT=3001
NODE_ENV=development

DB_SERVER=127.0.0.1
DB_USER=sa
DB_PASSWORD=tu_contraseña_segura
DB_INVENTARIO=InventarioGP

JWT_SECRET=genera_un_secreto_aleatorio_de_32_caracteres
JWT_EXPIRES_IN=8h

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend

Copia `frontend/.env.example` como `frontend/.env` (opcional, solo necesario si el backend está en otro dominio):

```env
VITE_API_URL=
```

## Base de datos

### Configurar SQL Server

1. Asegúrate de que SQL Server esté corriendo y accesible.
2. Crea la base de datos `InventarioGP` (o el nombre que configures en `.env`).

### Ejecutar migraciones

Las migraciones están en `backend/migrations/`. Ejecútalas en orden numérico:

```bash
# Conecta a SQL Server y ejecuta:
# 1. backend/migrations/001_caracteristicas_equipo.sql
# 2. backend/migrations/002_serie_garantia_equipos.sql
```

## Ejecución en desarrollo

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

El frontend se abrirá en `http://localhost:5173` (el proxy de Vite redirige `/api` al backend en `http://localhost:3001`).

## Build de producción

```bash
cd frontend
npm run build
# El resultado está en frontend/dist/
```

Sirve `frontend/dist/` con un servidor web (Nginx, IIS, etc.) y configura un reverse proxy para `/api` hacia el backend.

## Despliegue

### Windows (IIS + PM2 o IISNode)

1. Construye el frontend: `cd frontend && npm run build`
2. Copia `frontend/dist/` a `C:\inetpub\wwwroot\inventario`
3. Configura IIS URL Rewrite para redirigir `/api/*` al backend
4. Para el backend, usa PM2: `pm2 start backend/src/index.js --name inventario-api`

### Linux (Nginx + PM2)

```bash
# Construir frontend
cd frontend && npm run build

# Configurar Nginx
sudo nano /etc/nginx/sites-available/inventario

# Servir frontend y redirigir /api al backend
server {
    listen 80;
    server_name inventario.tudominio.com;

    root /var/www/inventario/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Iniciar backend con PM2
cd backend
pm2 start src/index.js --name inventario-api
pm2 save
pm2 startup
```

## Seguridad

### Antes de producción

- [ ] **Rotar credenciales**: Cambiar la contraseña `sa` de SQL Server y el `JWT_SECRET`.
- [ ] **Configurar `.env`**: No usar valores por defecto.
- [ ] **CORS**: Limitar `CORS_ORIGINS` a los dominios específicos.
- [ ] **HTTPS**: Configurar SSL/TLS en el reverse proxy.
- [ ] **Rate limiting**: Ajustar los límites en `backend/src/middleware/rateLimiter.js`.
- [ ] **JWT**: Ajustar `JWT_EXPIRES_IN` según la política de la empresa (ej: `2h`).
- [ ] **Auditar logs**: No almacenar tokens ni contraseñas en logs.

### Medidas implementadas

- ✅ Helmet (cabeceras HTTP seguras)
- ✅ CORS restringido por entorno
- ✅ Rate limiting en login
- ✅ JWT con expiración configurable
- ✅ Errores SQL no exponen detalles internos
- ✅ Contraseñas no viajan en texto plano (SQL Server)
- ✅ Zod para validación de entrada
- ✅ Autenticación en todas las rutas sensibles
- ✅ Control de roles (ADMIN, TECNICO)

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| ADMIN | CRUD completo, gestión de usuarios, sincronización, reportes |
| TECNICO | CRUD de equipos, componentes, asignaciones, incidencias |
| VISUALIZADOR | Solo lectura (si se implementa) |

## API - Endpoints principales

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/auth/login` | No | - | Inicio de sesión |
| GET | `/api/auth/me` | Sí | - | Datos del usuario actual |
| GET | `/api/equipos` | Sí | - | Listar equipos |
| POST | `/api/equipos` | Sí | ADMIN/TECNICO | Crear equipo |
| POST | `/api/equipos/:id/baja` | Sí | ADMIN | Dar de baja |
| GET | `/api/componentes` | Sí | - | Listar componentes |
| GET | `/api/trabajadores` | Sí | - | Listar trabajadores |
| GET | `/api/asignaciones` | Sí | - | Listar asignaciones |
| POST | `/api/incidencias` | Sí | ADMIN/TECNICO | Registrar incidencia |

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `EADDRINUSE` en backend | El puerto 3001 está ocupado. Cambia `PORT` en `.env` o detén el proceso existente. |
| Error de conexión SQL Server | Verifica que SQL Server esté corriendo, que TCP/IP esté habilitado y que las credenciales en `.env` sean correctas. |
| `Invalid column name` | Ejecuta las migraciones pendientes. La estructura de la BD no coincide con el código. |
| Token inválido | El token expiró o el `JWT_SECRET` cambió. Vuelve a iniciar sesión. |
| Pantalla en blanco en frontend | Abre la consola del navegador (F12) y verifica errores de red o de JavaScript. |
