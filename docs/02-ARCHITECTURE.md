# 🏗 CONCORD — ARQUITETURA TÉCNICA DE ALTO NÍVEL

> Arquitetura proposta para evolução do Concord de MVP demo para SaaS enterprise global

---

## 1. VISÃO GERAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CDN (Cloudflare)                            │
│                    Static Assets + Edge Cache                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────────┐
│                     Load Balancer (NGINX/ALB)                       │
│               SSL Termination + WebSocket Upgrade                   │
└──────┬──────────────────┬──────────────────┬───────────────────────┘
       │                  │                  │
┌──────┴──────┐  ┌────────┴────────┐  ┌──────┴──────┐
│  Frontend   │  │   API Gateway   │  │  WebSocket  │
│  (Next.js)  │  │   (NestJS)      │  │  Gateway    │
│  SSR + SPA  │  │   REST + GQL    │  │  Socket.IO  │
│  Port 3000  │  │   Port 3001     │  │  Port 3001  │
└──────┬──────┘  └────────┬────────┘  └──────┬──────┘
       │                  │                  │
       │         ┌────────┴────────┐         │
       │         │   Service Layer │         │
       │         │  ┌────────────┐ │         │
       │         │  │ Auth       │ │         │
       │         │  │ Tenant     │ │         │
       │         │  │ Commun.    │ │         │
       │         │  │ Workspace  │ │         │
       │         │  │ Knowledge  │ │         │
       │         │  │ Analytics  │ │         │
       │         │  │ Automation │ │         │
       │         │  └────────────┘ │         │
       │         └────────┬────────┘         │
       │                  │                  │
┌──────┴──────────────────┴──────────────────┴───────────────────────┐
│                       Data Layer                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │PostgreSQL│  │  Redis   │  │ BullMQ   │  │ Object Storage   │   │
│  │  (Main)  │  │ (Cache + │  │ (Jobs)   │  │ (S3/R2)          │   │
│  │          │  │  PubSub) │  │          │  │ Files+Avatars    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. MULTI-TENANT ARCHITECTURE

### Modelo de Isolamento: **Row-Level Security (RLS)**

Todas as tabelas possuem `tenantId` como chave de particionamento lógico.

```
┌─────────────────────────────────────────────────────────┐
│                     Request Flow                         │
│                                                         │
│  Request → Auth (JWT) → Tenant Guard → Service → Prisma │
│                │              │            │             │
│                ▼              ▼            ▼             │
│          userId          tenantId     WHERE tenantId=X   │
│          extracted       validated    injected in query   │
└─────────────────────────────────────────────────────────┘
```

### Escalabilidade por Tenant

| Plano | Banco | Cache | WebSocket | Storage |
|-------|-------|-------|-----------|---------|
| Free/Starter | Shared DB (RLS) | Shared Redis (prefixed) | Shared gateway | Shared bucket (prefixed) |
| Professional | Shared DB (RLS) | Dedicated Redis namespace | Shared gateway | Shared bucket |
| Enterprise | Dedicated schema ou DB | Dedicated Redis instance | Dedicated namespace | Dedicated bucket |

### Tenant Context Propagation

```typescript
// Middleware → Guard → Service pipeline
@Injectable()
export class TenantMiddleware {
  // Extrai X-Tenant-Id header
  // Valida tenant exists + isActive
  // Anexa tenantId ao request
}

@Injectable()  
export class TenantGuard {
  // Valida JWT user pertence ao tenant
  // Verifica IDOR (URL param == header)
  // Anexa role ao request
}

// Em cada service:
async findAll(tenantId: string) {
  return this.prisma.board.findMany({
    where: { workspace: { tenantId } }
  });
}
```

---

## 3. EVENT-DRIVEN ARCHITECTURE

### Event Bus Pattern

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│ Service  │────▶│  Event Bus   │────▶│  Consumers      │
│ (emits)  │     │  (Redis      │     │                 │
│          │     │   Pub/Sub)   │     │  • WebSocket    │
│          │     │              │     │    broadcast     │
│          │     │              │     │  • Notification  │
│          │     │              │     │  • Timeline      │
│          │     │              │     │  • Automation    │
│          │     │              │     │  • Webhook       │
│          │     │              │     │  • Analytics     │
└──────────┘     └──────────────┘     └─────────────────┘
```

### Eventos do Sistema

```typescript
// Core events
interface DomainEvent {
  id: string;           // UUID
  type: string;         // 'message.created', 'card.moved'
  tenantId: string;
  userId: string;
  timestamp: Date;
  payload: unknown;
  metadata: {
    ip: string;
    userAgent: string;
    correlationId: string;
  };
}

// Event types
type EventType =
  // Communication
  | 'message.created' | 'message.updated' | 'message.deleted' | 'message.pinned'
  | 'reaction.toggled' | 'channel.created' | 'typing.started' | 'typing.stopped'
  // Workspace
  | 'card.created' | 'card.updated' | 'card.moved' | 'card.deleted' | 'card.assigned'
  | 'column.created' | 'column.reordered' | 'board.created'
  // Knowledge  
  | 'page.created' | 'page.updated' | 'page.deleted' | 'block.updated'
  // Auth
  | 'user.login' | 'user.logout' | 'member.invited' | 'member.removed';
```

### Filas de Processamento (BullMQ)

```
┌──────────────────────────────────────────────────────────┐
│                    BullMQ Queues                          │
│                                                          │
│  notifications   │ Push, email, in-app notifications     │
│  automations     │ Rule evaluation + action execution    │
│  webhooks        │ HTTP delivery with retry              │
│  analytics       │ Event aggregation + metrics calc      │
│  timeline        │ Cross-module event materialization    │
│  ai-completions  │ AI API calls (rate-limited)           │
│  file-processing │ Image resize, thumbnail generation    │
│  email           │ Transactional emails (invite, reset)  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. REAL-TIME ARCHITECTURE

### WebSocket Gateway Strategy

```
                    ┌─────────────────────────┐
                    │     Socket.IO Server     │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │  /communication   │  │
                    │  │  Chat, Typing,    │  │
                    │  │  Voice, Presence  │  │
                    │  └───────────────────┘  │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │  /realtime        │  │
                    │  │  Board sync,      │  │
                    │  │  Page collab,     │  │
                    │  │  Card updates     │  │
                    │  └───────────────────┘  │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │  /notifications   │  │
                    │  │  (future)         │  │
                    │  │  Push, badges     │  │
                    │  └───────────────────┘  │
                    └─────────────────────────┘
```

### Redis Adapter para Scaling Horizontal

```typescript
// Quando há múltiplas instâncias do servidor:
@WebSocketGateway({ namespace: '/communication' })
export class CommunicationGateway {
  constructor() {
    // Redis adapter permite broadcast cross-instance
    this.server.adapter(createAdapter(redisClient));
  }
}
```

### Collaborative Editing (Yjs + CRDT)

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ Client A │◄───▶│   Yjs CRDT   │◄───▶│ Client B │
│ (TipTap) │     │   Provider   │     │ (TipTap) │
└──────────┘     │   (WebSocket)│     └──────────┘
                 └──────┬───────┘
                        │
                 ┌──────┴───────┐
                 │  PostgreSQL  │
                 │  (persist    │
                 │   document)  │
                 └──────────────┘
```

---

## 5. CACHE STRATEGY

### Cache Layers

```
┌──────────────────────────────────────────────┐
│              Cache Architecture               │
│                                              │
│  L1: React State (Zustand)                   │
│      → Component-level, instant              │
│                                              │
│  L2: HTTP Cache (Service Worker)             │
│      → Browser cache, offline-capable        │
│                                              │
│  L3: Redis Cache (Server-side)               │
│      → Shared across instances               │
│      → TTL-based invalidation                │
│                                              │
│  L4: PostgreSQL Query Cache                  │
│      → Materialized views for dashboards     │
│      → Prepared statements                   │
└──────────────────────────────────────────────┘
```

### Redis Cache Keys

```
concord:{tenantId}:user:{userId}           → User profile (TTL 24h)
concord:{tenantId}:members                 → Tenant members list (TTL 1h)
concord:{tenantId}:channels:{serverId}     → Channel list (TTL 5min)
concord:{tenantId}:board:{boardId}         → Board with columns (TTL 5min)
concord:{tenantId}:page:{pageId}           → Page with blocks (TTL 5min)
concord:{tenantId}:online                  → Online users set (no TTL)
concord:session:{refreshToken}             → Session data (TTL = token expiry)
concord:ratelimit:{ip}:{endpoint}          → Rate limit counter (TTL 1min)
```

---

## 6. DATABASE ARCHITECTURE

### Schema Domains

```
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL 16                       │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   CORE      │  │ COMMUNICATION│  │ WORKSPACE │ │
│  │             │  │              │  │           │ │
│  │ • tenants   │  │ • servers    │  │ • boards  │ │
│  │ • users     │  │ • channels   │  │ • columns │ │
│  │ • tenant_   │  │ • messages   │  │ • cards   │ │
│  │   users     │  │ • reactions  │  │ • labels  │ │
│  │ • sessions  │  │ • mentions   │  │ • checks  │ │
│  │ • invites   │  │ • perms      │  │ • history │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  KNOWLEDGE  │  │  ANALYTICS   │  │  SYSTEM   │ │
│  │             │  │  (future)    │  │           │ │
│  │ • pages     │  │              │  │ • audit   │ │
│  │ • blocks    │  │ • events     │  │ • webhooks│ │
│  │ • versions  │  │ • metrics    │  │ • automtn │ │
│  │ • perms     │  │ • dashboards │  │ • flags   │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

### Índices Críticos

```sql
-- Mensagens (query mais frequente)
CREATE INDEX idx_messages_channel_created 
  ON messages(channel_id, created_at DESC);

-- Cards por coluna + posição  
CREATE INDEX idx_cards_column_position 
  ON cards(column_id, position);

-- Blocos por página + posição
CREATE INDEX idx_blocks_page_position 
  ON blocks(page_id, position);

-- Full-text search em mensagens
CREATE INDEX idx_messages_search 
  ON messages USING gin(to_tsvector('portuguese', content));

-- Audit log por tenant + data
CREATE INDEX idx_audit_tenant_date 
  ON audit_logs(tenant_id, created_at DESC);

-- Tenant user lookup
CREATE UNIQUE INDEX idx_tenant_user 
  ON tenant_users(tenant_id, user_id);
```

---

## 7. SECURITY ARCHITECTURE

### Defense in Depth

```
┌──────────────────────────────────────────────────────┐
│                   Security Layers                     │
│                                                      │
│  Layer 1: Network                                    │
│  ├── TLS 1.3 everywhere                              │
│  ├── WAF (Cloudflare/AWS WAF)                        │
│  ├── DDoS protection                                 │
│  └── IP allowlisting (Enterprise)                    │
│                                                      │
│  Layer 2: Application                                │
│  ├── JWT + Refresh Token rotation                    │
│  ├── CSRF protection (SameSite cookies)              │
│  ├── Rate limiting (per IP, per tenant)              │
│  ├── Input validation (class-validator)              │
│  ├── SQL injection prevention (Prisma ORM)           │
│  ├── XSS prevention (CSP headers + sanitization)    │
│  └── Helmet.js security headers                      │
│                                                      │
│  Layer 3: Authorization                              │
│  ├── RBAC (Owner > Admin > Mod > Member > Guest)     │
│  ├── Tenant isolation (TenantGuard + RLS)            │
│  ├── Resource ownership validation                   │
│  ├── Channel permissions (read/write/manage)         │
│  └── Page permissions (per-user and per-role)        │
│                                                      │
│  Layer 4: Data                                       │
│  ├── Encryption at rest (PostgreSQL TDE)             │
│  ├── Encryption in transit (TLS)                     │
│  ├── Password hashing (bcrypt, 12 rounds)            │
│  ├── Sensitive data masking in logs                  │
│  └── GDPR compliance (data export/deletion)          │
│                                                      │
│  Layer 5: Monitoring                                 │
│  ├── Audit trail (all mutations logged)              │
│  ├── Anomaly detection (unusual login patterns)      │
│  ├── Security alerts (failed login spikes)           │
│  └── Incident response playbook                     │
└──────────────────────────────────────────────────────┘
```

---

## 8. OBSERVABILITY STACK

```
┌──────────────────────────────────────────────────┐
│              Observability Pipeline               │
│                                                  │
│  Application                                     │
│  ├── Winston (structured JSON logs)              │
│  ├── OpenTelemetry SDK (traces + metrics)        │
│  └── Sentry SDK (error tracking)                 │
│                                                  │
│       ▼              ▼              ▼            │
│                                                  │
│  Collection                                      │
│  ├── Fluentd/Vector (log aggregation)            │
│  ├── OTLP Collector (trace aggregation)          │
│  └── Prometheus (metric scraping)                │
│                                                  │
│       ▼              ▼              ▼            │
│                                                  │
│  Storage + Visualization                         │
│  ├── Loki (logs) → Grafana                       │
│  ├── Tempo/Jaeger (traces) → Grafana             │
│  ├── Prometheus (metrics) → Grafana              │
│  └── Sentry (errors) → Dashboard                 │
│                                                  │
│  Alerting                                        │
│  ├── P99 latency > 500ms → PagerDuty/Slack      │
│  ├── Error rate > 1% → PagerDuty/Slack           │
│  ├── DB connection pool > 80% → Alert            │
│  └── Queue depth > 1000 → Alert                  │
└──────────────────────────────────────────────────┘
```

---

## 9. KUBERNETES DEPLOYMENT

```yaml
# Simplified K8s Architecture
Namespace: concord-production
│
├── Deployment: api (3 replicas, HPA 3-10)
│   ├── Container: nestjs-api
│   ├── Resource limits: 512Mi RAM, 500m CPU
│   ├── Health: /api/v1/health/live
│   ├── Readiness: /api/v1/health/ready
│   └── Environment: ConfigMap + Secrets
│
├── Deployment: frontend (2 replicas)
│   ├── Container: nextjs-app
│   └── Resource limits: 256Mi RAM, 250m CPU
│
├── Deployment: worker (2 replicas)
│   ├── Container: bullmq-workers
│   └── Queues: notifications, automations, webhooks
│
├── StatefulSet: postgresql (1 primary + 1 read replica)
│   ├── Storage: 100Gi PVC
│   └── Backup: pg_dump daily → S3
│
├── StatefulSet: redis (1 primary + 1 replica)
│   ├── Storage: 10Gi PVC
│   └── Persistence: AOF enabled
│
├── Service: api-service (ClusterIP)
├── Service: frontend-service (ClusterIP)
├── Ingress: concord.app (TLS + WebSocket upgrade)
│
├── HorizontalPodAutoscaler: api
│   ├── Min: 3, Max: 10
│   ├── Target CPU: 70%
│   └── Target Memory: 80%
│
└── CronJob: db-backup (daily 02:00 UTC)
```

---

## 10. FRONTEND ARCHITECTURE (EVOLUÇÃO)

### De Vite SPA → Next.js Full-Stack

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── [tenantSlug]/
│   │   │   ├── chat/
│   │   │   │   └── [channelId]/page.tsx
│   │   │   ├── boards/
│   │   │   │   └── [boardId]/page.tsx
│   │   │   ├── pages/
│   │   │   │   └── [pageId]/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx          # Dashboard shell
│   │   └── layout.tsx              # Tenant context provider
│   └── layout.tsx                  # Root layout (theme, auth)
│
├── features/                       # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store.ts
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChannelSidebar.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── ThreadPanel.tsx
│   │   │   └── MemberList.tsx
│   │   ├── hooks/
│   │   │   ├── useMessages.ts
│   │   │   ├── useChannels.ts
│   │   │   └── useTyping.ts
│   │   └── store.ts
│   ├── board/
│   │   ├── components/
│   │   │   ├── BoardColumn.tsx
│   │   │   ├── CardItem.tsx
│   │   │   ├── CardModal.tsx
│   │   │   ├── BoardFilters.tsx
│   │   │   └── CalendarView.tsx
│   │   ├── hooks/
│   │   └── store.ts
│   ├── pages/
│   │   ├── components/
│   │   │   ├── PageEditor.tsx
│   │   │   ├── BlockRenderer.tsx
│   │   │   └── PageTree.tsx
│   │   ├── hooks/
│   │   └── store.ts
│   ├── analytics/
│   └── settings/
│
├── shared/
│   ├── components/               # Design system
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── useKeyboardShortcut.ts
│   │   └── useOnClickOutside.ts
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── ws-client.ts
│   │   ├── cn.ts
│   │   └── utils.ts
│   └── types/
│       ├── models.ts
│       └── api.ts
│
└── providers/
    ├── AuthProvider.tsx
    ├── TenantProvider.tsx
    ├── ThemeProvider.tsx
    ├── WebSocketProvider.tsx
    └── NotificationProvider.tsx
```
