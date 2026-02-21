# 🗺 CONCORD — ROADMAP DE 8 SPRINTS

> Visão: Transformar o Concord em uma **plataforma colaborativa SaaS global** que une comunicação, gestão de tarefas e documentação inteligente — sem quebrar funcionalidades existentes.

---

## SPRINT 1 — FUNDAÇÃO ARQUITETURAL (Semanas 1-2)

### 🎯 Objetivo Estratégico
Estabelecer a base técnica sólida que permitirá toda a evolução futura. Decompor monolitos, criar sistema de testes, e preparar a infraestrutura de build.

### 📦 Entregas Técnicas

**1.1 — Decomposição dos Componentes Monolíticos**
- Quebrar `ChatView.tsx` (1.502 LOC) em ~15 componentes:
  - `ChannelSidebar/`, `ChannelHeader/`, `MessageList/`, `MessageBubble/`, `MessageInput/`, `VoicePanel/`, `MemberListPanel/`, `PinnedMessages/`, `MembersModal/`
- Quebrar `BoardView.tsx` (882 LOC) em ~8 componentes:
  - `BoardSidebar/`, `BoardColumn/`, `CardItem/`, `CardDetailModal/`, `ChecklistSection/`, `CommentSection/`
- Quebrar `PagesView.tsx` (788 LOC) em ~8 componentes:
  - `PageSidebar/`, `PageEditor/`, `BlockRenderer/`, `SlashCommandMenu/`, `PageBreadcrumb/`, `CoverPicker/`

**1.2 — Estrutura de Pastas Feature-Based**
```
src/
├── features/
│   ├── auth/          → AuthScreen, LoginForm, RegisterForm, LegacyLogin
│   ├── chat/          → ChannelSidebar, MessageList, MessageBubble, etc.
│   ├── board/         → BoardSidebar, BoardColumn, CardItem, etc.
│   ├── pages/         → PageSidebar, PageEditor, BlockRenderer, etc.
│   └── settings/      → ThemePicker, WallpaperPicker, WorkspaceSettings
├── shared/
│   ├── components/    → Avatar, Button, Modal, Input, Badge, Tooltip
│   ├── hooks/         → useDebounce, useClickOutside, useKeyboard
│   ├── stores/        → Zustand stores
│   ├── services/      → API services
│   └── types/         → Domain types
└── infrastructure/    → HTTP client, WS client, utils
```

**1.3 — Setup de Testes**
- Vitest + React Testing Library para frontend
- Jest + Supertest para backend (já configurado)
- Mínimo: 1 teste por store, 1 teste por service
- GitHub Actions CI pipeline: lint → type-check → test → build

**1.4 — Error Boundaries**
- `ErrorBoundary` global no `App.tsx`
- Error boundaries por módulo (chat, board, pages)
- Fallback UI com "Algo deu errado" + botão de reload

### 🏗 Mudanças Arquiteturais
- Adoção de feature-based folder structure
- Criação de shared hooks library
- Setup de Vitest config
- `.github/workflows/ci.yml`

### ⚠️ Riscos
- Quebrar funcionalidades existentes durante decomposição
- Merge conflicts se mais de uma pessoa trabalhar

### 🔗 Dependências
- Nenhuma externa

### ✅ Resultado Esperado
- Componentes com máximo 200 LOC
- CI rodando em cada PR
- Zero regressão funcional

### 📊 Métricas de Sucesso
- 0 componentes com >300 LOC
- CI green no primeiro run
- ≥10 testes passando

---

## SPRINT 2 — INFRAESTRUTURA SAAS (Semanas 3-4)

### 🎯 Objetivo Estratégico
Conectar o frontend ao backend NestJS real, eliminando a dependência do relay server (`data.json`) para o modo enterprise. Manter modo legacy funcional.

### 📦 Entregas Técnicas

**2.1 — Wiring Frontend ↔ Backend (Modo API)**
- Criar hooks de integração para cada módulo:
  - `useApiWorkspaces()` — carrega workspaces/servers do backend
  - `useApiChannels(serverId)` — carrega canais via API
  - `useApiMessages(channelId)` — carrega mensagens paginadas
  - `useApiBoards(tenantId)` — carrega boards via API
  - `useApiPages(tenantId)` — carrega pages via API
- Pattern: hooks verificam `authStore.mode === 'api'` para decidir fonte de dados

**2.2 — Dual-Mode Store Architecture**
```typescript
// Padrão para cada store:
const useChatStore = create((set, get) => ({
  // ... state
  sendMessage: async (channelId, content) => {
    const mode = useAuthStore.getState().mode;
    if (mode === 'api') {
      // Chama API → atualiza store com resposta
      const msg = await communicationService.sendMessage(tenantId, channelId, content);
      set(s => { /* adiciona msg ao state */ });
    } else {
      // Modo legacy — comportamento atual (local + sync relay)
      set(s => { /* adiciona msg localmente */ });
    }
  }
}));
```

**2.3 — Migração de Dados**
- Script `prisma migrate dev` para criar tabelas
- Seed script para dados iniciais (usuários Zyntra → banco real)
- Endpoint de importação: `POST /api/v1/migrate` (recebe `data.json` → popula PostgreSQL)

**2.4 — Real-Time via Socket.IO (Modo API)**
- Conectar `wsClient` (Socket.IO) ao backend quando `mode === 'api'`
- Ouvir eventos: `message:new`, `message:update`, `card:moved`, `block:updated`
- Emitir eventos: `typing:start`, `typing:stop`, `voice:join`, `voice:leave`
- Manter WebSocket relay para `mode === 'legacy'`

**2.5 — Health Check & Observabilidade**
- `GET /api/v1/health` — retorna status de DB, Redis, uptime
- Structured logging com Winston
- Request ID tracking

### 🏗 Mudanças Arquiteturais
- Stores tornam-se dual-mode (API vs legacy)
- Socket.IO client ativado para modo API
- Prisma migrations criadas
- Seed data configurado

### ⚠️ Riscos
- Inconsistência de tipos entre frontend models.ts e backend Prisma
- Timeout de conexão com backend pode degradar UX
- Migração de dados existentes pode perder informações

### 🔗 Dependências
- Sprint 1 (decomposição de componentes)
- PostgreSQL e Redis rodando (docker-compose)
- Variáveis de ambiente configuradas

### ✅ Resultado Esperado
- Usuário pode escolher "Enterprise" no login → backend real
- Dados persistem em PostgreSQL
- Real-time via Socket.IO
- Modo legacy continua funcionando

### 📊 Métricas de Sucesso
- Login enterprise → dados carregam do backend
- 0 regressão no modo legacy
- Mensagem enviada aparece em <500ms para outro usuário
- Health check retorna 200

---

## SPRINT 3 — KANBAN CORE (Semanas 5-6)

### 🎯 Objetivo Estratégico
Elevar o módulo Kanban de "demo funcional" para "ferramenta profissional de gestão de projetos" com features enterprise.

### 📦 Entregas Técnicas

**3.1 — Board Features Avançadas**
- Filtros: por assignee, label, prioridade, due date
- Board templates (3 pré-definidos: Scrum, Kanban, Bug Tracking)
- WIP limits por coluna (visual: coluna fica vermelha quando excede)
- Card archiving com painel de arquivados
- Board cover/background customizável

**3.2 — Card Features Avançadas**
- Attachments: upload de arquivos (integração S3/R2)
- Activity log: histórico de todas as alterações (`card_history` table)
- Card relations: "bloqueado por", "relacionado com"
- Custom fields por board (texto, número, data, select)
- Card templates

**3.3 — Drag & Drop Aprimorado**
- `@dnd-kit` ou `react-beautiful-dnd` para drag-and-drop robusto
- Cross-board card moving
- Multi-select cards (Ctrl+click → mover em batch)
- Animações de transição

**3.4 — Views Alternativas**
- List view (tabela com sorting e grouping)
- Calendar view (cards com due date em calendário)
- Timeline/Gantt view (básico)

### 🏗 Mudanças Arquiteturais
- File upload service (S3/Cloudflare R2)
- Custom fields schema (PostgreSQL JSONB)
- Board settings modal expandido

### ⚠️ Riscos
- Drag-and-drop com sync real-time pode gerar conflitos de posição
- Custom fields aumentam complexidade do schema

### 🔗 Dependências
- Sprint 2 (backend connectivity)
- Serviço de storage (S3/R2)

### ✅ Resultado Esperado
- Kanban com feature parity de ferramentas profissionais
- Upload de arquivos funcionando
- Filtros e views alternativas

### 📊 Métricas de Sucesso
- 3 board templates disponíveis
- Upload de arquivo em <2s (até 10MB)
- Calendar view renderiza 50+ cards sem lag
- Drag-and-drop funciona cross-column e cross-board

---

## SPRINT 4 — KANBAN REAL-TIME (Semanas 7-8)

### 🎯 Objetivo Estratégico
Implementar colaboração real-time no Kanban com conflict resolution e presença, tornando viável o uso simultâneo por equipes.

### 📦 Entregas Técnicas

**4.1 — Real-Time Board Sync**
- Eventos granulares via Socket.IO:
  - `card:created`, `card:updated`, `card:moved`, `card:deleted`
  - `column:created`, `column:updated`, `column:reordered`
- Optimistic updates com rollback em caso de erro

**4.2 — Presence on Board**
- Indicador de "quem está vendo este board"
- Cursor de outros usuários (opcional, fase 2)
- Lock visual quando alguém está editando um card

**4.3 — Conflict Resolution**
- Last-write-wins com timestamp servidor
- Toast notification quando outro usuário move um card que você está editando
- Queue de operações offline com replay ao reconectar

**4.4 — Notificações Contextuais**
- Notificação quando:
  - Card é atribuído a você
  - Card com due date próximo (1 dia, vencido)
  - Comentário no seu card
  - Card movido para "Done"

### 🏗 Mudanças Arquiteturais
- WebSocket event bus para board module
- Optimistic update pattern nos stores
- Notification system expandido

### ⚠️ Riscos
- Race conditions em drag-and-drop simultâneo
- Optimistic rollback pode causar "flash" visual

### 🔗 Dependências
- Sprint 3 (Kanban core features)
- Socket.IO gateways (já implementados no backend)

### ✅ Resultado Esperado
- 5 usuários editando o mesmo board sem conflitos
- Presença visível em real-time
- Notificações automáticas de eventos

### 📊 Métricas de Sucesso
- Card move aparece para outros em <200ms
- 0 perda de dados em operações simultâneas
- Notificações entregues em <1s
- Reconexão transparente em <5s

---

## SPRINT 5 — COMUNICAÇÃO TEXTO (Semanas 9-10)

### 🎯 Objetivo Estratégico
Elevar o chat de "mensagens básicas" para "hub de comunicação profissional" com threads, DMs, busca e integrações.

### 📦 Entregas Técnicas

**5.1 — Message Threads**
- Reply to message → abre thread lateral
- Thread count indicator no message bubble
- Thread panel com scroll infinito
- Utilizar `parentId` já existente no modelo Message

**5.2 — Direct Messages**
- DM channel type (1-to-1)
- DM list na sidebar (seção separada)
- Online indicator nos DMs
- Group DMs (até 8 participantes)

**5.3 — Message Search**
- Full-text search com PostgreSQL `tsvector`
- Search UI: modal com filtros (autor, canal, data)
- Highlight de resultados
- Jump to message (scroll to + highlight)

**5.4 — Rich Message Features**
- @mentions com autocomplete (digitar `@` → dropdown)
- Link previews (Open Graph scraping)
- File attachments em mensagens (imagens, PDFs)
- Message formatting toolbar (bold, italic, code, quote)
- Unread message indicators por canal (badge count)

**5.5 — Message Pagination**
- Cursor-based pagination (carregar 50 por vez)
- Virtual scrolling para performance
- "Jump to latest" button
- "X new messages" indicator

### 🏗 Mudanças Arquiteturais
- Message virtualization (react-virtuoso)
- File upload pipeline (reusa Sprint 3)
- Full-text search indexes no PostgreSQL
- OpenGraph scraping service (backend)

### ⚠️ Riscos
- Virtual scrolling com real-time messages é complexo
- Link preview scraping pode ser bloqueado por CORS
- Search performance com muitas mensagens

### 🔗 Dependências
- Sprint 2 (backend connectivity)
- Sprint 3 (file upload service)

### ✅ Resultado Esperado
- Chat profissional com threads e DMs
- Busca funcional
- @mentions e link previews
- Performance com 10k+ mensagens

### 📊 Métricas de Sucesso
- Thread reply aparece em <300ms
- Search retorna em <500ms para 100k mensagens
- Virtual scroll mantém 60fps com 10k mensagens
- Unread count preciso em <1s

---

## SPRINT 6 — DOCUMENTAÇÃO INTELIGENTE (Semanas 11-12)

### 🎯 Objetivo Estratégico
Transformar o editor de páginas em uma ferramenta de documentação colaborativa profissional com rich-text real, templates e versionamento.

### 📦 Entregas Técnicas

**6.1 — Rich Text Engine**
- Migrar de `contentEditable` divs para **TipTap/ProseMirror** ou **Plate.js**
- Toolbar de formatação: bold, italic, underline, strikethrough, highlight, color
- Inline code, code blocks com syntax highlighting
- Links inline com preview
- Tables com merge cells e resize

**6.2 — Collaborative Editing**
- Yjs + TipTap para CRDT-based collaborative editing
- Cursor de outros usuários (nome + cor)
- Awareness: quem está editando que bloco
- Conflict-free merge automático

**6.3 — Templates & Versioning**
- 5 templates pré-definidos: Meeting Notes, Spec, RFC, Retrospective, OKRs
- Version history: timeline visual com diff
- Restore previous version
- Utilizar `page_versions` table já existente

**6.4 — Features Avançadas**
- Table of Contents automático (gerado de headings)
- Export: PDF, Markdown, HTML
- Page sharing (link público com permissões)
- Embed blocks (YouTube, Figma, Google Docs)
- Database blocks (tabela inline com filtros — como Notion)

**6.5 — Integração Chat ↔ Pages**
- "Criar página a partir de mensagem" (seleciona mensagens → gera doc)
- Embed de página no chat (preview inline)
- Link bidirecional: page menciona channel, channel menciona page

### 🏗 Mudanças Arquiteturais
- Migração para TipTap/Plate.js
- Yjs WebSocket provider para CRDT sync
- PDF generation service (backend)
- OpenGraph/embed resolver service

### ⚠️ Riscos
- Migração de editor é ALTA complexidade
- CRDT sync com muitos usuários pode ter latência
- PDF generation consome memória

### 🔗 Dependências
- Sprint 2 (backend connectivity)
- Sprint 4 (real-time architecture patterns)

### ✅ Resultado Esperado
- Editor profissional nível Notion
- Collaborative editing sem conflitos
- Templates e versionamento funcional
- Integração bidirecional chat ↔ pages

### 📊 Métricas de Sucesso
- Collaborative editing com 5 cursores simultâneos
- Version restore em <2s
- PDF export em <5s para doc de 20 páginas
- Editor carrega em <500ms

---

## SPRINT 7 — INFRAESTRUTURA GLOBAL (Semanas 13-14)

### 🎯 Objetivo Estratégico
Preparar a infraestrutura para escala global: multi-região, observabilidade, segurança enterprise, e deployment profissional.

### 📦 Entregas Técnicas

**7.1 — Containerização & Orquestração**
- Kubernetes manifests (deployment, service, ingress, HPA)
- Helm chart para deploy parametrizado
- Health checks: `/health/live`, `/health/ready`
- Graceful shutdown com drain de conexões

**7.2 — Observabilidade**
- Structured logging: Winston → JSON format
- Error tracking: Sentry integration (frontend + backend)
- APM: OpenTelemetry → Jaeger/Grafana
- Métricas: Prometheus exporter (request latency, WS connections, queue depth)
- Dashboard Grafana pré-configurado

**7.3 — Segurança Enterprise**
- OAuth2/OIDC: Google, GitHub, Microsoft SSO
- SAML 2.0 para enterprise customers
- Rate limiting com Redis (por tenant, por IP)
- Content Security Policy headers
- Audit trail completo (já existe `audit_logs`)
- Data encryption at rest (PostgreSQL TDE)
- GDPR: data export endpoint, account deletion

**7.4 — Multi-Região**
- PostgreSQL read replicas (via connection string routing)
- Redis Cluster com Sentinel
- CDN para assets estáticos (Cloudflare)
- WebSocket sticky sessions (via cookie/header)
- Environment-based config (staging, production)

**7.5 — CI/CD Pipeline Completo**
```
PR → lint → type-check → test → build
        ↓ (merge to main)
    → build docker image → push to registry
        ↓
    → deploy to staging → smoke tests
        ↓ (manual approval)
    → deploy to production → health check → rollback if failed
```

### 🏗 Mudanças Arquiteturais
- Kubernetes-native deployment
- 12-factor app compliance
- Secret management (Vault/AWS Secrets Manager)
- Database migration pipeline
- Blue-green deployment strategy

### ⚠️ Riscos
- Custo de infraestrutura Kubernetes
- Complexity de multi-região
- SSO/SAML integration com IDPs variados

### 🔗 Dependências
- Sprints 1-6 (todas as features)
- Cloud provider (AWS/GCP/Azure)
- DNS e certificados TLS

### ✅ Resultado Esperado
- Deploy automatizado com zero downtime
- Observabilidade completa
- SSO enterprise funcionando
- Infraestrutura pronta para escala

### 📊 Métricas de Sucesso
- Deploy time <5min (CI/CD pipeline total)
- P99 latency <200ms para API
- 99.9% uptime
- Error rate <0.1%
- Mean time to recovery <5min

---

## SPRINT 8 — DIFERENCIAÇÃO E INTELIGÊNCIA (Semanas 15-16)

### 🎯 Objetivo Estratégico
Criar os diferenciais competitivos que tornam o Concord único no mercado: integração nativa entre módulos, analytics, automações e preparação para IA.

### 📦 Entregas Técnicas

**8.1 — Timeline Unificada**
- Feed cronológico que une:
  - Mensagens enviadas
  - Cards criados/movidos/completados
  - Páginas editadas
  - Membros adicionados
- Filtros: por módulo, por usuário, por período
- "Jump to context" — clica e vai para o item original

**8.2 — Cross-Module Integration**
- **Card → Page**: botão "Criar documentação" no card → gera página vinculada
- **Message → Card**: seleciona mensagem → "Criar tarefa" → card com link para mensagem
- **Page → Cards**: table block em página que lista cards filtrados
- **Chat → Everywhere**: `#card-123`, `#page-456` linkam automaticamente

**8.3 — Dashboard Executivo**
- Métricas por workspace/tenant:
  - Mensagens enviadas (gráfico temporal)
  - Cards completados vs criados
  - Páginas ativas
  - Tempo médio de card no "In Progress"
  - Membros mais ativos
- Export CSV/PDF dos reports
- Widget de KPIs personalizáveis

**8.4 — Sistema de Automações**
- Regras configuráveis:
  - "Quando card mover para Done → enviar mensagem no #general"
  - "Quando card vencer → notificar assignee"
  - "Quando nova página criada → notificar workspace"
  - "Quando mention no chat → criar notificação persistente"
- Interface visual de configuração (trigger → condition → action)
- Powered by BullMQ (background processing)

**8.5 — Preparação para IA**
- Endpoint de AI completions: `POST /api/v1/ai/complete`
- Integração com OpenAI/Anthropic API:
  - Resumo de thread de chat
  - Geração de descrição de card
  - Auto-complete em páginas
  - Sugestão de labels/assignees
- Feature flag para habilitar/desabilitar por tenant
- Rate limiting de AI por plano

**8.6 — Webhooks & API Pública**
- Webhook system: tenant configura URLs para receber eventos
- API pública documentada com Swagger/OpenAPI
- API keys management
- Webhook retry com exponential backoff

### 🏗 Mudanças Arquiteturais
- Event sourcing para timeline (ou materialized views)
- BullMQ workers para automações
- Webhook delivery system
- AI service abstraction layer
- Feature flags system

### ⚠️ Riscos
- AI integration costs (tokens)
- Automação loops (ação triggera outra ação infinitamente)
- Timeline query performance com muitos eventos

### 🔗 Dependências
- Sprints 1-7 (todas)
- AI API keys (OpenAI/Anthropic)
- Webhook infrastructure

### ✅ Resultado Esperado
- Produto diferenciado no mercado
- Cross-module integration funcional
- Dashboard com métricas reais
- Automações configuráveis
- IA assistiva

### 📊 Métricas de Sucesso
- Timeline carrega em <1s (últimas 100 entradas)
- Cross-link creation em <500ms
- Dashboard renders em <2s
- Automação executa em <5s após trigger
- AI suggestion em <3s

---

## 📅 TIMELINE RESUMIDA

```
SEMANAS  1-2  │ Sprint 1 — Fundação Arquitetural
SEMANAS  3-4  │ Sprint 2 — Infraestrutura SaaS
SEMANAS  5-6  │ Sprint 3 — Kanban Core
SEMANAS  7-8  │ Sprint 4 — Kanban Real-Time
SEMANAS  9-10 │ Sprint 5 — Comunicação Texto
SEMANAS 11-12 │ Sprint 6 — Documentação Inteligente
SEMANAS 13-14 │ Sprint 7 — Infraestrutura Global
SEMANAS 15-16 │ Sprint 8 — Diferenciação e Inteligência
```

**Duração total: 16 semanas (4 meses)**  
**Com buffer de 20%: ~5 meses**
