# 📈 CONCORD — PLANO DE EVOLUÇÃO 12 MESES

> De demo funcional a SaaS global competitivo

---

## RESUMO EXECUTIVO

| Fase | Período | Foco | Meta |
|------|---------|------|------|
| 🏗️ Foundation | Meses 1–2 | Infraestrutura + Testes + CI | Estabilidade técnica |
| 🔌 Integration | Meses 3–4 | Frontend ↔ Backend | SaaS real funcionando |
| ⚡ Core Features | Meses 5–6 | Kanban + Chat + Pages | Feature parity Trello/Slack |
| 🚀 Differentiators | Meses 7–8 | Timeline + AI + Automations | Unique value proposition |
| 📊 Scale | Meses 9–10 | Multi-tenant + K8s + SSO | Enterprise readiness |
| 🌍 Global | Meses 11–12 | i18n + Marketplace + Analytics | Global launch ready |

---

## FASE 1: FOUNDATION (Meses 1–2)

### Mês 1: Decomposição + Qualidade

**Semana 1–2: Decomposição dos God Components**
```
Antes:  ChatView.tsx = 1.502 LOC (12+ componentes inline)
Depois: ChatView.tsx ≈ 100 LOC (composição de 12 componentes separados)

Componentes a extrair:
- ChatView → ChannelSidebar, MessageList, MessageInput, ChannelHeader
              MemberListPanel, PinnedMessages, VoiceChannelView
              MembersModal, MarkdownRenderer, TypingIndicator
              UserInfoPanel, VoicePanel

- BoardView → BoardSidebar, BoardCanvas, BoardColumn, CardItem
              CardModal, ColumnHeader

- PagesView → PageSidebar, PageTree, PageEditor, EditorToolbar
              CoverPicker, IconPicker, PageBreadcrumb
```

**Semana 2–3: Infraestrutura de Testes**
```
Stack de Testes:
├── Vitest          → Unit tests (stores, hooks, utils)
├── Testing Library → Component tests
├── Playwright      → E2E tests (critical paths)
└── MSW             → API mocking
```

**Meta de cobertura:**
```
Mês 1: 30% coverage (stores + utils + hooks)
Mês 2: 50% coverage (+ components)
Mês 6: 70% coverage (+ integration)
Mês 12: 80%+ coverage
```

**Semana 3–4: CI/CD Pipeline**
```yaml
# GitHub Actions
stages:
  - lint (ESLint + Prettier)
  - type-check (tsc --noEmit)
  - test (Vitest + coverage report)
  - build (Vite production build)
  - security (npm audit + Snyk)
  - deploy-preview (Vercel/Railway preview)
  - deploy-prod (auto on main merge)
```

### Mês 2: Unificação de Types + Error Handling

**Semana 5–6: Type System Unification**
```typescript
// ANTES: 2 type systems conflitantes
// models.ts (usado pelo frontend)
// api.types.ts (gerado pelo backend, nunca usado)

// DEPOIS: Uma única source of truth
// Opção A: Prisma → gerador de types compartilhados
// Opção B: OpenAPI schema → codegen

// Shared types package
@concord/shared-types
├── models/          # Entity types
├── dto/             # Request/Response types
├── events/          # WebSocket event types
└── enums/           # Shared enumerations
```

**Semana 7–8: Error Boundaries + Loading States**
```typescript
// Cada feature module ganha:
<ErrorBoundary fallback={<FeatureError />}>
  <Suspense fallback={<FeatureSkeleton />}>
    <FeatureComponent />
  </Suspense>
</ErrorBoundary>
```

---

## FASE 2: INTEGRATION (Meses 3–4)

### Mês 3: Frontend ↔ Backend Connection

**Semana 9–10: API Client + Interceptors**
```typescript
// Axios/Fetch wrapper com:
// - JWT auto-attach
// - Token refresh automático
// - Retry com exponential backoff
// - Request/response logging
// - Error normalization

const apiClient = createApiClient({
  baseURL: '/api/v1',
  interceptors: {
    request: [authInterceptor, tenantInterceptor],
    response: [errorInterceptor, cacheInterceptor],
  },
});
```

**Semana 11: Store Migration (Zustand → API)**
```
Migração por feature:
1. auth.store.ts    → API auth endpoints ✅ (já parcial)
2. chat.store.ts    → API communication endpoints
3. board.store.ts   → API workspace endpoints
4. pages.store.ts   → API knowledge endpoints
5. theme.store.ts   → Manter local (preferência do usuário)
6. navigation.store → Manter local (estado de UI)

Padrão de migração:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Component   │────▶│  Store Hook  │────▶│  API Service │
│  (same API)  │     │  (adapter)   │     │  (HTTP call) │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                    ┌─────┴──────┐
                    │ Optimistic │
                    │ Updates +  │
                    │ Rollback   │
                    └────────────┘
```

**Semana 12: Eliminar Relay Server**
```
ANTES:
  Frontend → WebSocket Relay → data.json (arquivo local)

DEPOIS:
  Frontend → API Backend → PostgreSQL + Redis (produção)
  Frontend → WebSocket Gateway → Redis Pub/Sub (real-time)

Steps:
1. Redirecionar todos os stores para API endpoints
2. Substituir sync.middleware.ts por API calls + optimistic updates
3. Implementar WebSocket events via Socket.IO (já tem gateway no backend)
4. Desativar relay server (manter como fallback offline mode futuro)
5. Remover data.json persistence
```

### Mês 4: Real-Time + Auth Completo

**Semana 13–14: WebSocket Integration**
```typescript
// Socket.IO client integrado
const socket = io('/communication', {
  auth: { token: getAccessToken() },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

// Events:
socket.on('message.created', handleNewMessage);
socket.on('message.updated', handleMessageEdit);
socket.on('message.deleted', handleMessageDelete);
socket.on('user.typing', handleTyping);
socket.on('user.presence', handlePresence);
socket.on('card.moved', handleCardMove);
socket.on('page.updated', handlePageUpdate);
```

**Semana 15–16: Auth Flow Completo**
```
Registration → Email verification → Login → JWT pair
                                            ├── Access token (15min)
                                            └── Refresh token (7d)

Multi-device session management:
- Session list in settings
- Revoke individual sessions
- "Disconnect all devices"

Password:
- bcrypt (12 rounds) server-side
- Complexity requirements
- Reset via email token
```

---

## FASE 3: CORE FEATURES (Meses 5–6)

### Mês 5: Kanban Profissional

**Features por sprint:**

```
Sprint 3 (Semana 17–18): Kanban Core
├── Card filters (label, assignee, date, custom fields)
├── Card templates
├── Board templates
├── Column WIP limits
├── Card due dates + calendar view
├── Card attachments (S3 upload)
├── Drag & drop otimizado (@dnd-kit)
└── Board permissions (view, edit, admin)

Sprint 4 (Semana 19–20): Kanban Real-Time
├── Optimistic drag updates
├── Conflict resolution (last-write-wins com notificação)
├── Presence indicators (quem está vendo o board)
├── Live card updates (sem refresh)
├── Board activity feed
├── Export CSV/PDF
└── Keyboard shortcuts (j/k navigate, e edit, c create)
```

### Mês 6: Chat Profissional + Pages

**Chat (Semana 21–22):**
```
├── Message threads (respostas em thread como Slack)
├── Direct messages (1:1 e group DM)
├── Message search (full-text com PostgreSQL tsvector)
├── Virtual scrolling (react-virtuoso)
├── File sharing (S3 + preview)
├── Link previews (meta scraping server-side)
├── Emoji reactions (expandido)
├── Message pinning + bookmarks
├── Read receipts per channel
├── Notification preferences per channel
└── Pagination server-side (eliminar carregar 10k msgs)
```

**Pages (Semana 23–24):**
```
├── TipTap editor (substituir textarea por rich text)
├── Block types: heading, paragraph, list, code, image, table, embed
├── Slash commands (/ para inserir blocos)
├── Nested pages (árvore infinita)
├── Page templates
├── Cover images + icons (page-level)
├── Table of contents (auto-generated)
├── Page history (versioning)
├── Page sharing (public links)
└── Collaborative editing (Yjs CRDT)
```

---

## FASE 4: DIFFERENTIATORS (Meses 7–8)

### Mês 7: Diferenciação Competitiva

**Timeline Unificada (Semana 25–26):**
```
O diferencial #1 do Concord — contexto unificado:

Eventos consolidados de TODAS as features:
├── Chat:  "João mencionou esta tarefa no #geral"
├── Board: "Card movido de 'Doing' para 'Done' por Maria"
├── Pages: "Documentação atualizada por Pedro"
├── Git:   "PR #42 merged (futuro)"
└── AI:    "Resumo automático das últimas 24h"

Cada entidade (card, page, channel, user) tem sua timeline
Cross-linking automático entre features
```

**Entity Cross-Linking (Semana 25–26):**
```typescript
// Mencionar card em mensagem → cria link bidirecional
// Mencionar page em card → cria link bidirecional
// Tudo aparece na timeline unificada

interface EntityLink {
  sourceType: 'card' | 'message' | 'page';
  sourceId: string;
  targetType: 'card' | 'message' | 'page';
  targetId: string;
  linkType: 'mention' | 'reference' | 'blocks' | 'duplicates';
  createdBy: string;
  createdAt: Date;
}
```

### Mês 8: AI + Automations

**Concord AI (Semana 27–28):**
```
Recursos AI por feature:

Chat:
├── Resumo de conversas (últimas 24h / 7d)
├── Sugestão de resposta
└── Tradução automática

Board:
├── Decomposição de tarefas (1 card → sub-cards)
├── Estimativa de esforço
├── Detecção de blockers
└── Sugestão de prioridade

Pages:
├── Geração de conteúdo
├── Correção gramatical
├── Resumo executivo
└── Tradução de documentos

Timeline:
├── "O que aconteceu enquanto eu estava fora?"
├── Insights de produtividade
└── Trend analysis
```

**Automations Engine (Semana 29–30):**
```
Triggers → Conditions → Actions

Triggers:
├── card.created, card.moved, card.completed
├── message.contains_keyword
├── page.updated
├── schedule (cron)
└── webhook.received

Conditions:
├── card.label == "bug"
├── card.assignee == null
├── message.channel == "#alerts"
└── time.is_business_hours

Actions:
├── Send notification
├── Move card to column
├── Assign user
├── Post message in channel
├── Create card from template
├── Call external webhook
└── Update custom field

Exemplos prontos:
1. "Quando card for criado com label 'bug' → notificar #bugs"
2. "Quando card ficar 7 dias em 'Review' → notificar assignee"
3. "Quando PR for merged → mover card para 'Done'"
4. "Todo dia às 9h → postar resumo do board no #daily"
```

---

## FASE 5: SCALE (Meses 9–10)

### Mês 9: Enterprise Features

**SSO + SAML (Semana 33–34):**
```
├── SAML 2.0 (Azure AD, Okta, OneLogin)
├── OAuth2 / OIDC (Google Workspace, GitHub)
├── SCIM provisioning (auto-create users from IdP)
├── JIT provisioning (create on first login)
├── Domain verification (auto-join tenant)
└── Enforce SSO (disable password login per tenant)
```

**Audit Log + Compliance (Semana 35–36):**
```
├── Comprehensive audit trail (already partially built)
├── Export audit logs (CSV/JSON)
├── Data retention policies per plan
├── GDPR compliance
│   ├── Data export (user requests)
│   ├── Data deletion (right to be forgotten)
│   └── Consent management
├── SOC 2 preparation
└── Data residency options (EU/US/APAC)
```

### Mês 10: Infrastructure Scale

**Kubernetes + Observability (Semana 37–40):**
```
Production Infrastructure:
├── K8s cluster (EKS/GKE)
│   ├── API pods (HPA: 2–20 replicas)
│   ├── WebSocket pods (sticky sessions)
│   ├── Worker pods (BullMQ processors)
│   └── Cron pods (scheduled jobs)
├── PostgreSQL (RDS/CloudSQL with read replicas)
├── Redis Cluster (ElastiCache/Memorystore)
├── S3/R2 (file storage + CDN)
├── CloudFront/Cloudflare (CDN + WAF)
├── OpenTelemetry (distributed tracing)
├── Grafana + Prometheus (metrics + dashboards)
├── Sentry (error tracking)
├── PagerDuty (alerting)
└── Terraform (IaC)

SLAs target:
├── 99.9% uptime
├── <200ms API p95 latency
├── <100ms WebSocket delivery
└── <2s page load (LCP)
```

---

## FASE 6: GLOBAL (Meses 11–12)

### Mês 11: Internacionalização

**i18n + Localization (Semana 41–42):**
```
├── react-i18next setup
├── Idiomas iniciais: pt-BR, en-US, es-ES
├── Date/number formatting (Intl API)
├── RTL support (preparação para ar, he)
├── Currency localization (pricing page)
└── Timezone handling (user preference)
```

**App Marketplace (Semana 43–44):**
```
├── Plugin SDK (TypeScript)
├── Plugin types:
│   ├── Board plugins (custom fields, views)
│   ├── Chat plugins (bots, integrations)
│   ├── Page plugins (custom blocks)
│   └── Automation triggers/actions
├── Built-in integrations:
│   ├── GitHub / GitLab
│   ├── Jira (import)
│   ├── Slack (bridge)
│   ├── Google Drive
│   ├── Figma embeds
│   └── Zapier / Make webhooks
└── Developer portal + documentation
```

### Mês 12: Launch Readiness

**Analytics + Growth (Semana 45–46):**
```
Product Analytics:
├── Feature usage tracking (PostHog)
├── Cohort analysis
├── Funnel tracking (signup → activation → retention)
├── A/B testing framework
├── User segmentation
└── Health score per workspace

Growth Engine:
├── Self-serve signup flow
├── Onboarding wizard (5 steps)
├── Template gallery
├── Invite team flow
├── Usage-based upgrade prompts
└── Referral program
```

**Final Polish (Semana 47–48):**
```
├── Performance audit (Lighthouse 90+)
├── Accessibility audit (WCAG 2.1 AA)
├── Security pen-test
├── Load testing (k6, 10K concurrent users)
├── Documentation (API docs, user guides)
├── Landing page + pricing
├── Legal (ToS, Privacy Policy, DPA)
├── App Store submissions (if Electron/mobile)
└── 🚀 LAUNCH
```

---

## MARCOS (MILESTONES)

| Marco | Quando | Critério de Sucesso |
|-------|--------|---------------------|
| **M1: Technical Foundation** | Mês 2 | 50% test coverage, CI green, god components decomposed |
| **M2: SaaS Connected** | Mês 4 | Frontend 100% via API, relay server deprecated, auth complete |
| **M3: Feature Parity** | Mês 6 | Kanban = Trello, Chat = Slack básico, Pages = Notion básico |
| **M4: Unique Value** | Mês 8 | Timeline + AI + Automations = diferenciação real |
| **M5: Enterprise Ready** | Mês 10 | SSO, audit logs, K8s, 99.9% uptime |
| **M6: Global Launch** | Mês 12 | i18n, marketplace, analytics, Lighthouse 90+ |

---

## MÉTRICAS DE SUCESSO POR FASE

### Métricas Técnicas
```
Fase 1: Build time <30s, Test coverage >30%, 0 god components
Fase 2: API latency p95 <200ms, WebSocket delivery <100ms
Fase 3: Feature parity score vs competitors >80%
Fase 4: Cross-linking adoption >60% of active users
Fase 5: 99.9% uptime over 30 days, <500ms cold start
Fase 6: Lighthouse >90, WCAG AA compliant, 3 languages
```

### Métricas de Produto
```
Fase 1: N/A (internal quality)
Fase 2: 100 beta users, NPS >40
Fase 3: 500 users, DAU/MAU >30%, 7-day retention >40%
Fase 4: 2,000 users, avg 3+ features used per session
Fase 5: 10 enterprise trials, ARR >$50K
Fase 6: 10,000 users, ARR >$200K, 3 enterprise contracts
```

---

## EQUIPE NECESSÁRIA

### Fase 1–3 (Meses 1–6): Core Team
```
1x Tech Lead / Fullstack Senior      → Arquitetura + code review
1x Frontend Engineer (React/TS)      → Component decomposition + UI
1x Backend Engineer (NestJS/Node)     → API + database + auth
1x DevOps / SRE (part-time)          → CI/CD + infrastructure
```

### Fase 4–6 (Meses 7–12): Growth Team
```
+1x Frontend Engineer                → AI features + new modules
+1x Backend Engineer                 → Automations + scale
+1x Designer (UI/UX)                 → Design system + user research
+1x Product Manager                  → Roadmap + metrics + growth
+1x QA Engineer (part-time)          → E2E testing + security
```

---

## RISCOS E MITIGAÇÕES

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:---:|:---:|-----------|
| 1 | Migração relay → API quebra funcionalidade | Alta | Crítico | Feature flags, dual-mode durante transição |
| 2 | God component decomposition introduz bugs | Média | Alto | Testes antes de decompor, snapshot tests |
| 3 | Escopo creep nas features | Alta | Alto | Sprint planning rigoroso, MVP-first approach |
| 4 | Latência real-time com PostgreSQL | Média | Médio | Redis caching, WebSocket direct updates |
| 5 | Custo de infra escala rápido | Média | Médio | Serverless onde possível, Cloudflare Workers |
| 6 | Time de AI muda rápido | Alta | Baixo | Abstrair provider, adapter pattern |
| 7 | Competição move mais rápido | Média | Alto | Foco no diferencial (contexto unificado) |

---

> **Documento vivo** — Atualizar a cada sprint review
> **Próxima revisão**: Início do Sprint 1
