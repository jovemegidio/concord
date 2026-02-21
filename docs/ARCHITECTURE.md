# 🏗️ Concord - Enterprise Architecture Documentation

## Overview

Concord is a **Super App Colaborativo Enterprise** — a multi-tenant SaaS platform combining real-time communication (Discord-style), project management (Trello-style Kanban), and knowledge management (Notion-style documents) in a single unified workspace.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ React 18 │  │ Zustand  │  │Tailwind  │  │  Vite 5 (HMR) │  │
│  │   + TSX  │  │  Stores  │  │   CSS    │  │  Dev Server   │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └───────────────┘  │
│       │              │                                          │
│  ┌────┴──────────────┴──────────────────────────────────────┐  │
│  │                   API SERVICE LAYER                       │  │
│  │  authService · tenantService · communicationService       │  │
│  │  workspaceService · knowledgeService                      │  │
│  │  httpClient (JWT auto-refresh) · wsClient (Socket.IO)     │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTP / WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    NestJS 10 (REST API)                    │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐   │ │
│  │  │  Auth   │ │ Tenant  │ │ Comms   │ │  Workspace   │   │ │
│  │  │ Module  │ │ Module  │ │ Module  │ │   Module     │   │ │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬───────┘   │ │
│  │  ┌────┴────┐ ┌────┴────────────┴─────────────┴───────┐   │ │
│  │  │Knowledge│ │         Common Layer                   │   │ │
│  │  │ Module  │ │  Guards · Middleware · Interceptors     │   │ │
│  │  └─────────┘ │  Decorators · Filters · DTOs           │   │ │
│  │              └────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌──────────┐  ┌───────────┐                 │
│  │ Socket.IO   │  │ BullMQ   │  │  Swagger   │                 │
│  │ WebSocket   │  │  Queues  │  │  /api/docs │                 │
│  └──────┬──────┘  └────┬─────┘  └───────────┘                 │
└─────────┼───────────────┼───────────────────────────────────────┘
          │               │
┌─────────┼───────────────┼───────────────────────────────────────┐
│         │    INFRASTRUCTURE LAYER                               │
│  ┌──────┴──────┐  ┌────┴─────┐  ┌──────────────────────────┐  │
│  │ PostgreSQL  │  │  Redis 7 │  │    Prisma 5.8 ORM        │  │
│  │    16       │  │ (Cache,  │  │  (Schema, Migrations,    │  │
│  │ (Primary    │  │  PubSub, │  │   Type-safe queries)     │  │
│  │  Database)  │  │  Sessions)│  └──────────────────────────┘  │
│  └─────────────┘  └──────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Architecture

### Strategy: Shared Database with Tenant Isolation

```
┌─────────────────────────────────────────────┐
│              Request Pipeline                │
│                                             │
│  1. HTTP Request arrives                    │
│  2. TenantMiddleware                        │
│     ├── Extract X-Tenant-Id header          │
│     ├── Validate tenant exists & active     │
│     └── Attach tenantId to request          │
│  3. JwtAuthGuard                            │
│     ├── Validate Bearer token               │
│     └── Attach user to request              │
│  4. TenantGuard (IDOR protection)           │
│     ├── Verify user belongs to tenant       │
│     └── Reject cross-tenant access          │
│  5. RolesGuard (RBAC)                       │
│     └── Check user role permissions         │
│  6. Controller → Service → Prisma           │
│     └── All queries filtered by tenantId    │
└─────────────────────────────────────────────┘
```

### Database Schema (Key entities)

| Entity | Tenant-Scoped | Description |
|--------|:---:|-------------|
| Tenant | – | Organization / company |
| User | Global | Can belong to multiple tenants |
| TenantMember | ✅ | User ↔ Tenant relationship with role |
| Server | ✅ | Discord-like communication server |
| Channel | ✅ | Text/Voice/Announcement channels |
| Message | ✅ | Chat messages with reactions/mentions |
| Board | ✅ | Kanban board with columns |
| Card | ✅ | Board cards with assignments/checklists |
| Page | ✅ | Notion-like pages with blocks |
| AuditLog | ✅ | Complete audit trail |

---

## Module Structure

### Backend (`/backend/src/`)

```
src/
├── main.ts                     # Bootstrap + Security + CORS + Swagger
├── app.module.ts               # Root module (all imports)
├── common/
│   ├── decorators/             # @CurrentUser, @TenantId, @Roles
│   ├── guards/                 # JWT, Tenant (IDOR), Roles (RBAC)
│   ├── middleware/             # Tenant resolution, Logger
│   ├── filters/               # HTTP exception filter
│   ├── interceptors/          # Response transform
│   └── dto/                   # Pagination DTO
├── infrastructure/
│   ├── prisma/                # PrismaService + Module
│   └── redis/                 # RedisService + Module
└── modules/
    ├── auth/                  # JWT + Refresh Token rotation
    │   ├── dto/
    │   ├── strategies/        # Passport JWT strategy
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   └── auth.module.ts
    ├── tenant/                # Multi-tenant CRUD + RBAC
    ├── communication/         # Servers + Channels + Messages + Gateway
    │   ├── controllers/
    │   ├── services/
    │   ├── gateway/           # Socket.IO /communication
    │   └── dto/
    ├── workspace/             # Boards + Columns + Cards + Checklists
    │   ├── controllers/
    │   ├── services/
    │   └── dto/
    ├── knowledge/             # Pages + Blocks + Versions + Templates
    │   ├── controllers/
    │   ├── services/
    │   └── dto/
    ├── websocket/             # Real-time gateway (/realtime)
    └── audit/                 # Audit logging (global)
```

### Frontend (`/src/`)

```
src/
├── App.tsx                    # Main React app
├── main.tsx                   # Entry point
├── types/
│   ├── models.ts              # Existing local types
│   └── api.types.ts           # Backend-aligned domain types
├── infrastructure/
│   ├── http/client.ts         # HTTP client (JWT auto-refresh)
│   └── ws/client.ts           # WebSocket client (Socket.IO)
├── services/
│   └── api/                   # API service layer
│       ├── auth.service.ts
│       ├── tenant.service.ts
│       ├── communication.service.ts
│       ├── workspace.service.ts
│       └── knowledge.service.ts
├── stores/                    # Zustand state management
├── components/                # React components
│   ├── layout/
│   └── ui/
├── modules/                   # Feature modules
│   ├── chat/
│   ├── board/
│   └── pages/
├── hooks/                     # Custom React hooks
└── lib/                       # Utilities
```

---

## Security Model

### Authentication Flow

```
┌──────┐     POST /auth/login     ┌──────────┐
│Client├─────────────────────────►│  Auth    │
│      │     {email, password}     │ Service  │
│      │◄─────────────────────────┤          │
│      │  {accessToken,            │          │
│      │   refreshToken, user}     └──────────┘
│      │
│      │     GET /api/* (Bearer)   ┌──────────┐
│      ├─────────────────────────►│JwtAuth   │
│      │     Authorization:        │ Guard    │
│      │     Bearer <accessToken>  └──────────┘
│      │
│      │     POST /auth/refresh    ┌──────────┐
│      ├─────────────────────────►│  Auth    │
│      │     {refreshToken}        │ Service  │
│      │◄─────────────────────────┤ (Rotate) │
│      │  {new accessToken,        └──────────┘
│      │   new refreshToken}
└──────┘
```

### RBAC Roles

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control, delete tenant, manage all |
| **ADMIN** | Manage members, settings, all content |
| **MODERATOR** | Manage channels, moderate messages |
| **MEMBER** | Create/edit own content |
| **GUEST** | Read-only access |

---

## Infrastructure

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:16-alpine | 5432 | Primary database |
| redis | redis:7-alpine | 6379 | Cache, PubSub, Sessions |
| api | backend/Dockerfile | 3001 | NestJS API server |
| frontend | Dockerfile.frontend | 80 | React SPA |

### CI/CD Pipeline (GitHub Actions)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Backend    │     │   Frontend   │     │    Deploy     │
│    Tests     │     │    Build     │     │   (Manual)    │
│              │     │              │     │              │
│ ✓ Lint       │     │ ✓ Type check │     │ ✓ Docker     │
│ ✓ Unit test  │────►│ ✓ Build      │────►│   compose    │
│ ✓ Build      │     │ ✓ Artifacts  │     │   deploy     │
│ ✓ PostgreSQL │     └──────────────┘     └──────────────┘
│ ✓ Redis      │
└──────────────┘
```

---

## API Endpoints Summary

### Auth (`/api/auth`)
- `POST /register` — Register user + create default tenant
- `POST /login` — Login → JWT + Refresh Token
- `POST /refresh` — Rotate refresh token
- `POST /logout` — Invalidate session

### Tenants (`/api/tenants`)
- `POST /` — Create tenant
- `GET /` — List user's tenants
- `GET /:id` — Get tenant
- `PUT /:id` — Update tenant
- `GET /:id/members` — List members
- `POST /:id/members/invite` — Invite member
- `DELETE /:id/members/:userId` — Remove member
- `PUT /:id/members/:userId/role` — Update role

### Communication (`/api/tenants/:tenantId/...`)
- Servers: CRUD
- Channels: CRUD + reorder
- Messages: send, list (cursor), update, delete, react, pin, search

### Workspace (`/api/tenants/:tenantId/...`)
- Boards: CRUD
- Columns: CRUD + reorder
- Cards: CRUD + move + assign + checklists + comments

### Knowledge (`/api/tenants/:tenantId/...`)
- Pages: CRUD + tree + favorites + templates + versions + duplicate
- Blocks: CRUD + reorder + bulk update

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Quick Start with Docker

```bash
# Clone and start all services
docker compose up -d

# API available at http://localhost:3001/api
# Swagger docs at http://localhost:3001/api/docs
# Frontend at http://localhost:80
```

### Development Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend (from root)
npm install
npm run dev
```

---

## Migration Guide (Existing → Enterprise)

### Phase 1: Backend Foundation ✅
- NestJS backend with Clean Architecture
- PostgreSQL + Prisma ORM with multi-tenant schema
- Redis for caching, pub/sub, sessions
- JWT authentication with refresh token rotation

### Phase 2: Frontend API Layer ✅
- HTTP client with automatic JWT refresh
- WebSocket client for real-time features
- API services for all backend modules
- TypeScript types aligned with backend models

### Phase 3: Frontend Migration (Planned)
- Replace Zustand local state with API-backed state
- Connect ChatView to communication API
- Connect BoardView to workspace API
- Connect PagesView to knowledge API
- Add tenant switching UI
- Add authentication UI (login/register)

### Phase 4: Production Readiness (Planned)
- End-to-end testing
- Performance optimization
- Monitoring + alerting
- SSL/TLS configuration
- Database backups

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | – | JWT signing secret |
| `JWT_REFRESH_SECRET` | – | Refresh token signing secret |
| `JWT_EXPIRATION` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token TTL |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |
| `PORT` | `3001` | API server port |

---

## License

MIT — See [LICENSE](../LICENSE)
