# DOMUM Backend API

Backend API para la aplicación inmobiliaria DOMUM con sistema de autenticación y autorización basado en roles.

## Stack Tecnológico

- **Node.js** + **Express** - Framework web
- **PostgreSQL** - Base de datos
- **Prisma** - ORM
- **JWT** - Autenticación (access + refresh tokens)
- **bcrypt** - Hash de contraseñas

## Roles y Permisos

### SUPERADMIN
- Acceso total a todos los módulos
- Puede crear cualquier tipo de usuario (SUPERADMIN, ADMIN, VENDEDOR)
- Puede ver y gestionar la Caja
- Puede eliminar usuarios (soft delete)
- Puede cambiar roles de usuarios

### ADMIN
- Acceso a todo **EXCEPTO el módulo de Caja**
- Solo puede crear usuarios de tipo VENDEDOR
- Puede ver y gestionar todos los leads y propiedades
- No puede eliminar usuarios ni cambiar roles

### VENDEDOR
- Acceso limitado a:
  - **Propiedades**: Solo lectura de todas las propiedades
  - **CRM**: Solo ve los leads asignados a él
- Al crear un lead, se auto-asigna automáticamente a él
- No puede reasignar leads
- No puede crear usuarios
- No puede ver la Caja

## Instalación

### 1. Requisitos Previos

- Node.js 18+
- PostgreSQL 14+

### 2. Configuración

```bash
# Clonar e instalar dependencias
cd backend
npm install

# Copiar archivo de configuración
cp .env.example .env
```

### 3. Configurar Variables de Entorno

Editar `.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/domum?schema=public"
JWT_SECRET="tu-clave-secreta-cambiar-en-produccion"
JWT_REFRESH_SECRET="tu-refresh-secret-cambiar-en-produccion"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### 4. Inicializar Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar schema a la base de datos
npm run db:push

# Poblar con datos de ejemplo
npm run db:seed
```

### 5. Ejecutar

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

## Credenciales por Defecto

| Rol | Email | Contraseña |
|-----|-------|------------|
| SUPERADMIN | superadmin@domum.com.ar | Admin123! |
| ADMIN | admin@domum.com.ar | Admin123! |
| VENDEDOR | carlos.rodriguez@domum.com.ar | Admin123! |

## Endpoints API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refrescar access token |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| POST | `/api/auth/change-password` | Cambiar contraseña |

### Usuarios

| Método | Endpoint | Acceso |
|--------|----------|--------|
| GET | `/api/users` | SUPERADMIN, ADMIN |
| GET | `/api/users/:id` | SUPERADMIN, ADMIN, SELF |
| POST | `/api/users` | SUPERADMIN, ADMIN |
| PUT | `/api/users/:id` | SUPERADMIN, ADMIN |
| DELETE | `/api/users/:id` | SUPERADMIN |
| POST | `/api/users/:id/reset-password` | SUPERADMIN, ADMIN |

### Leads (CRM)

| Método | Endpoint | Acceso |
|--------|----------|--------|
| GET | `/api/leads` | SUPERADMIN, ADMIN: todos / VENDEDOR: solo asignados |
| GET | `/api/leads/stats` | Todos (filtrado por rol) |
| GET | `/api/leads/:id` | SUPERADMIN, ADMIN: todos / VENDEDOR: solo asignados |
| POST | `/api/leads` | Todos (VENDEDOR: auto-asignación) |
| PUT | `/api/leads/:id` | SUPERADMIN, ADMIN: todos / VENDEDOR: solo asignados |
| DELETE | `/api/leads/:id` | SUPERADMIN, ADMIN |
| POST | `/api/leads/:id/activities` | Según acceso al lead |

### Propiedades

| Método | Endpoint | Acceso |
|--------|----------|--------|
| GET | `/api/properties` | Público |
| GET | `/api/properties/:id` | Público |
| POST | `/api/properties` | SUPERADMIN, ADMIN |
| PUT | `/api/properties/:id` | SUPERADMIN, ADMIN |
| DELETE | `/api/properties/:id` | SUPERADMIN |

### Transacciones (Caja)

| Método | Endpoint | Acceso |
|--------|----------|--------|
| GET | `/api/transactions` | SUPERADMIN |
| GET | `/api/transactions/summary` | SUPERADMIN |
| GET | `/api/transactions/:id` | SUPERADMIN |
| POST | `/api/transactions` | SUPERADMIN |
| PUT | `/api/transactions/:id` | SUPERADMIN |
| DELETE | `/api/transactions/:id` | SUPERADMIN |

## Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma    # Esquema de base de datos
│   └── seed.js          # Datos iniciales
├── src/
│   ├── config/
│   │   ├── database.js    # Cliente Prisma
│   │   └── permissions.js # Configuración de permisos por rol
│   ├── middleware/
│   │   ├── auth.middleware.js          # Verificación de JWT
│   │   ├── authorization.middleware.js # Control de acceso por roles
│   │   └── error.middleware.js         # Manejo de errores
│   ├── routes/
│   │   ├── auth.routes.js        # Endpoints de autenticación
│   │   ├── user.routes.js        # CRUD de usuarios
│   │   ├── lead.routes.js        # CRUD de leads
│   │   ├── property.routes.js    # CRUD de propiedades
│   │   └── transaction.routes.js # CRUD de transacciones
│   ├── services/
│   │   └── auth.service.js       # Lógica de autenticación
│   └── index.js                  # Entry point
├── .env.example
├── package.json
└── README.md
```

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- JWT con tokens de corta duración (15 min) + refresh tokens (7 días)
- Rate limiting (100 req/15 min)
- Helmet para headers de seguridad
- CORS configurado
- Validación de inputs con express-validator
- Queries parametrizadas (Prisma)
- Soft delete para usuarios
