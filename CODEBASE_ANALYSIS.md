# DOMUM - Codebase Analysis

**Generated:** 2026-03-25 (Updated)

## Executive Summary

DOMUM is a full-stack **Real Estate Management System** (Sistema de Gestion Inmobiliaria) built with a Node.js/Express backend and vanilla JavaScript frontend. It provides comprehensive CRM, property management, rental administration, document generation, and financial tracking capabilities for real estate agencies operating primarily in Argentina.

---

## Project Structure

```
DOMUM/
├── .claude/                    # Claude Code agent configurations
│   ├── agents/                 # Custom agent definitions
│   │   ├── docs/              # Documentation agents
│   │   ├── misc/              # Miscellaneous agents
│   │   ├── orchestration/     # Orchestration agents
│   │   ├── qa/                # QA/Testing agents
│   │   ├── research/          # Research agents
│   │   └── software/          # Development agents
│   │       ├── automation/    # N8N automation expert
│   │       ├── backend/       # Backend expert
│   │       ├── frontend/      # Frontend/UX experts
│   │       └── pdf/           # PDF generation agents
│   └── commands/              # Custom slash commands
│
├── backend/                   # Node.js/Express API server
│   ├── node_modules/          # Dependencies
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema definition
│   │   └── seed.js            # Database seeder
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js    # Prisma client instance
│   │   │   └── permissions.js # Role-based access control
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js           # JWT authentication
│   │   │   ├── authorization.middleware.js  # RBAC authorization
│   │   │   ├── error.middleware.js          # Error handling
│   │   │   └── upload.middleware.js         # Multer file uploads
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Authentication endpoints
│   │   │   ├── contact.routes.js    # Contact CRUD
│   │   │   ├── dashboard.routes.js  # Dashboard stats
│   │   │   ├── document.routes.js   # Document management
│   │   │   ├── event.routes.js      # Calendar events
│   │   │   ├── lead.routes.js       # CRM leads
│   │   │   ├── pdf.routes.js        # PDF generation (Puppeteer)
│   │   │   ├── property.routes.js   # Properties CRUD
│   │   │   ├── rental.routes.js     # Rental contracts
│   │   │   ├── settings.routes.js   # App branding settings
│   │   │   ├── transaction.routes.js # Financial transactions
│   │   │   ├── upload.routes.js     # File upload handling
│   │   │   └── user.routes.js       # User management
│   │   ├── services/
│   │   │   └── auth.service.js      # Authentication logic
│   │   └── index.js                 # Express app entry point
│   ├── uploads/               # Uploaded files storage
│   ├── .env.example           # Environment template
│   ├── .gitignore
│   ├── docker-compose.yml     # PostgreSQL container setup
│   ├── package.json
│   └── README.md
│
├── src/                       # Frontend (vanilla JS SPA)
│   ├── css/
│   │   ├── variables.css      # CSS custom properties
│   │   ├── styles.css         # Main styles
│   │   └── components.css     # Component-specific styles
│   ├── data/                  # Mock/demo JSON data
│   │   ├── contacts.json
│   │   ├── document-templates.json
│   │   ├── events.json
│   │   ├── leads.json
│   │   ├── properties.json
│   │   ├── rentals.json
│   │   ├── temporary-bookings.json
│   │   ├── transactions.json
│   │   └── users.json
│   ├── js/
│   │   ├── api.js             # API client with data transformers
│   │   ├── app.js             # Main application (Router, Branding)
│   │   ├── components.js      # UI component generators
│   │   ├── data.js            # DataStore (state management)
│   │   ├── modals.js          # Modal dialogs
│   │   ├── pages.js           # Page templates
│   │   ├── panels.js          # Slide-out detail panels
│   │   ├── pdf-generator.js   # Client-side PDF helpers
│   │   └── utils.js           # Utility functions
│   ├── index.html             # Single page application shell
│   └── README.md
│
├── inmobiliaria.pen           # Pencil design file
├── CODEBASE_ANALYSIS.md       # This file
└── *.pdf                      # Sample PDF documents
```

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Backend Runtime** | Node.js | >=18.0.0 | Server runtime |
| **Backend Framework** | Express.js | ^4.18.3 | HTTP server & routing |
| **Database** | PostgreSQL | 15 (Alpine) | Primary data store |
| **ORM** | Prisma | ^5.10.0 | Database access & migrations |
| **Authentication** | JWT (jsonwebtoken) | ^9.0.2 | Access & refresh tokens |
| **Password Hashing** | bcrypt | ^5.1.1 | Secure password storage |
| **Validation** | express-validator | ^7.0.1 | Request validation |
| **Security** | Helmet | ^7.1.0 | HTTP security headers |
| **Rate Limiting** | express-rate-limit | ^7.2.0 | API rate limiting |
| **PDF Generation** | Puppeteer | ^24.39.1 | Server-side PDF rendering |
| **Image Processing** | Sharp | ^0.34.5 | Image optimization |
| **File Uploads** | Multer | ^2.1.1 | Multipart form handling |
| **Logging** | Morgan | ^1.10.0 | HTTP request logging |
| **Frontend** | Vanilla JavaScript | ES6+ | Single page application |
| **Icons** | Lucide Icons | latest | Icon library |
| **PDF (Client)** | html2pdf.js | ^0.10.1 | Client-side PDF fallback |
| **Fonts** | Inter | - | UI typography |
| **Container** | Docker Compose | v3.8 | PostgreSQL container |
| **Dev Tools** | nodemon | ^3.1.0 | Auto-restart on changes |

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                          │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐      │
│  │  App.js │ Pages   │ Modals  │ Panels  │Components│      │
│  └────┬────┴────┬────┴────┬────┴────┬────┴────┬────┘      │
│       └─────────┴─────────┼─────────┴─────────┘            │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DataStore (State Management)            │   │
│  │   - Local cache with API integration                 │   │
│  │   - Mock data fallback for demo mode                 │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API.js (HTTP Client)                    │   │
│  │   - Request helper with auth headers                 │   │
│  │   - Token refresh on 401                             │   │
│  │   - Data transformers (frontend ↔ backend enums)     │   │
│  └─────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼───────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Middleware Stack                   │   │
│  │  Helmet → CORS → RateLimit → JSON → Morgan → Auth    │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Route Handlers                     │   │
│  │  /auth │ /users │ /leads │ /properties │ /rentals   │   │
│  │  /contacts │ /events │ /transactions │ /documents   │   │
│  │  /dashboard │ /upload │ /pdf │ /settings            │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Services & Config                     │   │
│  │  AuthService │ Permissions │ ErrorHandler            │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Prisma ORM Client                       │   │
│  └─────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼───────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────┐
                  │   PostgreSQL     │
                  │   (Docker)       │
                  └──────────────────┘
```

### Data Flow

1. **User Action** → Frontend component captures event
2. **DataStore** → API method called (async)
3. **API.js** → HTTP request with JWT, data transformed to backend format
4. **Express Routes** → Request validated, authenticated, authorized
5. **Prisma** → Database query executed
6. **Response** → Data transformed to frontend format, cache updated
7. **UI Update** → Page re-rendered with fresh data

### Authentication Flow

```
Login:
  POST /api/auth/login → { accessToken, refreshToken, user }
  Tokens stored in localStorage

Protected Requests:
  Authorization: Bearer <accessToken>

Token Refresh (on 401):
  POST /api/auth/refresh → { accessToken }
  Automatic retry of original request
```

---

## Key Files & Entry Points

| File | Purpose | Key Exports/Functions |
|------|---------|----------------------|
| `backend/src/index.js` | Express app entry point | App setup, middleware chain, route registration |
| `backend/prisma/schema.prisma` | Database schema | Models: User, Lead, Property, Rental, Event, Transaction, Contact, Document, Settings |
| `backend/src/services/auth.service.js` | Authentication logic | `login()`, `hashPassword()`, `generateAccessToken()`, `verifyRefreshToken()` |
| `backend/src/config/permissions.js` | RBAC configuration | `ROLE_PERMISSIONS`, `hasModuleAccess()`, `hasPermission()` |
| `src/index.html` | SPA shell | Login screen, app layout, script includes |
| `src/js/app.js` | Main app + router | `App.init()`, `App.navigate()`, `Branding` object |
| `src/js/api.js` | HTTP client | All API methods, data transformers |
| `src/js/data.js` | State management | `DataStore` object with CRUD methods |

---

## Code Conventions

### Naming Conventions
- **Files:** lowercase with `.` separators (e.g., `auth.routes.js`, `auth.middleware.js`)
- **Variables/Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Database columns:** snake_case (via Prisma `@map`)
- **Enums:** UPPER_SNAKE_CASE (Prisma) → lowercase in frontend

### File Structure
- **Backend routes:** RESTful pattern `/api/<resource>`
- **Frontend modules:** Object-based (API, DataStore, App, Pages, Components)
- **CSS:** BEM-like naming (`.component__element--modifier`)

### Module System
- **Backend:** CommonJS (`require`/`module.exports`)
- **Frontend:** Global objects on `window` (no bundler)

### Error Handling
- Backend: `asyncHandler` wrapper + centralized `errorHandler` middleware
- Frontend: Try/catch with `Toast.show()` notifications

---

## Dependencies

### Production Dependencies (Backend)
| Package | Purpose |
|---------|---------|
| `@prisma/client` | Database ORM client |
| `bcrypt` | Password hashing |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variables |
| `express` | HTTP framework |
| `express-rate-limit` | API rate limiting |
| `express-validator` | Request validation |
| `helmet` | Security headers |
| `jsonwebtoken` | JWT tokens |
| `morgan` | Request logging |
| `multer` | File uploads |
| `puppeteer` | PDF generation |
| `sharp` | Image processing |

### Development Dependencies (Backend)
| Package | Purpose |
|---------|---------|
| `nodemon` | Auto-restart on file changes |
| `prisma` | ORM CLI & migrations |

### Frontend (CDN)
| Library | Purpose |
|---------|---------|
| Lucide Icons | SVG icons |
| html2pdf.js | Client-side PDF (fallback) |
| Inter Font | Typography |

---

## API & Integrations

### REST API Endpoints

| Resource | Endpoints | Auth Required |
|----------|-----------|---------------|
| `/api/auth` | POST login, refresh, logout, change-password; GET me | Partial |
| `/api/users` | CRUD + reset-password | Yes (RBAC) |
| `/api/leads` | CRUD + activities, stats | Yes |
| `/api/properties` | CRUD | Yes |
| `/api/contacts` | CRUD | Yes |
| `/api/events` | CRUD + upcoming | Yes |
| `/api/rentals` | CRUD + expiring, adjustments, stats | Yes |
| `/api/transactions` | CRUD + summary | Yes |
| `/api/documents` | CRUD + stats | Yes |
| `/api/tasks` | CRUD + my-tasks, stats, complete | Yes |
| `/api/upload` | POST property images, temp images; DELETE image | Yes |
| `/api/pdf` | POST generate, document/:id | Yes |
| `/api/dashboard` | GET stats, quick-stats | Yes |
| `/api/settings` | GET (public), PUT (SUPERADMIN) | Partial |
| `/api/health` | GET | No |

### External Services
- **None currently** - Self-contained application
- **Future potential:** Email notifications, WhatsApp integration, property portals

---

## Build & Deployment

### Development Commands

```bash
# Backend
cd backend
npm install           # Install dependencies
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed demo data
npm run dev           # Start with nodemon (hot reload)
npm start             # Production start

# Database
docker compose up -d  # Start PostgreSQL container
```

### Frontend Development

```bash
# No build required - serve static files
# Use any local server:
npx serve src         # or
npx http-server src   # or
python -m http.server 5500 --directory src
```

### Production Deployment
1. Set environment variables (see below)
2. Run `npm run db:migrate` on first deploy
3. Start with `npm start` or process manager (PM2)
4. Serve frontend via nginx/CDN

---

## Environment Variables

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Access token signing key | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Yes | - |
| `JWT_EXPIRES_IN` | Access token TTL | No | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | No | `7d` |
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment mode | No | `development` |
| `FRONTEND_URL` | CORS origin | No | `http://localhost:5500` |

---

## Testing

Currently no automated tests are configured. The project uses:
- Manual testing
- Demo/mock data for frontend development
- Claude Code QA agents (`.claude/agents/qa/`)

### Suggested Testing Setup
- **Backend:** Jest + Supertest for API testing
- **Frontend:** Playwright or Cypress for E2E

---

## Database Schema Overview

### Core Models

| Model | Purpose | Key Relations |
|-------|---------|---------------|
| `User` | System users (agents, admins) | Creates leads, assigned to properties/events |
| `Lead` | Potential clients in CRM | Belongs to User (agent), linked to Property |
| `Property` | Real estate listings | Has many Leads, Rentals, Events, Documents |
| `Contact` | External contacts (owners, tenants, vendors) | Used in Rentals, Events |
| `Event` | Calendar events | Links to Property, Lead, Contact, User |
| `Rental` | Long-term rental contracts | Property + Propietario + Inquilino (Contacts) |
| `TemporaryBooking` | Short-term rentals | Property + Guest details |
| `Transaction` | Financial records | Income/expense tracking |
| `GeneratedDocument` | AI-generated legal docs | Based on templates, linked to Property |
| `Task` | Task management for leads | Assigned to User, linked to Lead/Property |
| `LeadActivity` | Lead interaction history | Call logs, emails, visits, follow-ups |
| `Settings` | App branding config | Colors, logo, company name |

### Enums
- **Role:** SUPERADMIN, ADMIN, VENDEDOR
- **LeadStage:** NUEVO, CONTACTO_INICIAL, CALIFICADO, VISITA_PROGRAMADA, NEGOCIACION, CERRADO_GANADO, PERDIDO
- **LeadSource:** REFERIDO, INSTAGRAM, FACEBOOK, LINKEDIN, GOOGLE, DIRECTO, OTRO
- **PropertyType:** DEPARTAMENTO, CASA, PH, LOCAL, OFICINA, TERRENO, COCHERA, QUINTA, EDIFICIO
- **PropertyOperation:** VENTA, ALQUILER, ALQUILER_TEMPORARIO
- **PropertyStatus:** DISPONIBLE, RESERVADA, VENDIDA, ALQUILADA, SUSPENDIDA
- **EventType:** VISITA, REUNION, LLAMADA, FIRMA, TASACION, CAPACITACION, AJUSTE_ALQUILER, VENCIMIENTO_CONTRATO, OTRO
- **TaskPriority:** ALTA, MEDIA, BAJA
- **TaskStatus:** PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA
- **ActivityType:** LLAMADA_ENTRANTE, LLAMADA_SALIENTE, WHATSAPP, EMAIL, VISITA, REUNION, NOTA, OFERTA, SEGUIMIENTO
- **ActivityOutcome:** EXITOSO, SIN_RESPUESTA, OCUPADO, RECHAZADO, PENDIENTE, NO_APLICA

---

## Role-Based Access Control (RBAC)

| Permission | SUPERADMIN | ADMIN | VENDEDOR |
|------------|------------|-------|----------|
| All modules | Yes | No (except Caja) | Limited |
| View all leads | Yes | Yes | Own only |
| Edit any property | Yes | Yes | No |
| View Caja (finances) | Yes | No | No |
| Manage users | Yes | Yes (limited) | No |
| Delete users | Yes | No | No |
| Create SUPERADMIN | Yes | No | No |
| Create ADMIN | Yes | No | No |
| Create VENDEDOR | Yes | Yes | No |

---

## Notes & Observations

### Strengths
1. **Clean separation** of frontend/backend with clear API boundaries
2. **Comprehensive data model** covering real estate workflows
3. **Spanish localization** for Argentine market
4. **Role-based permissions** with granular control
5. **Branding system** for white-label deployment
6. **Document generation** with legal templates
7. **Hybrid data mode** - works offline with mock data

### Areas for Improvement
1. **No automated tests** - critical for production
2. **No TypeScript** - larger codebases benefit from typing
3. **No bundler** - frontend could use Vite/webpack for optimization
4. **No caching layer** - Redis could improve performance
5. **Limited error tracking** - consider Sentry integration

### Security Considerations
1. JWT tokens in localStorage (consider httpOnly cookies)
2. Rate limiting configured (100 req/15min)
3. Helmet enabled for security headers
4. Password validation enforced (8+ chars, mixed case, numbers)
5. Refresh token rotation on use

### Scalability Notes
1. Prisma supports connection pooling
2. Static files could be CDN-hosted
3. PDF generation is CPU-intensive (consider queue)
4. Image uploads stored locally (consider S3/Cloudinary)

### Coming Soon Mode
The frontend has a `COMING_SOON_MODE` flag (currently `true` in `app.js`) that limits enabled pages to:
- CRM
- Usuarios (Users)
- Contactos (Contacts)
- Propiedades (Properties)

Other pages (Dashboard, Calendario, Administraciones, Documentos IA, Caja, Informes, Configuración) display a "Próximamente" (Coming Soon) placeholder.

### Frontend Module Overview
| Module | Purpose |
|--------|---------|
| `App` | Main application object - routing, navigation, page event handlers, branding |
| `Branding` | Theme customization (colors, logo, company name) - loads from backend Settings |
| `API` | HTTP client with JWT handling, automatic token refresh, data transformers |
| `DataStore` | State management with local cache + API integration, fallback to mock data |
| `Pages` | Page template generators (HTML strings) |
| `Components` | Reusable UI component generators (cards, tables, forms) |
| `Modals` | Modal dialog handlers (CRUD forms, confirmations, file uploads) |
| `Panels` | Slide-out detail panels for leads, properties, rentals, etc. |
| `Utils` | Helper functions (formatting, date handling, initials, etc.) |
| `Toast` | Toast notification system |
| `DocumentPDFGenerator` | Client-side PDF generation using html2pdf.js |
