# 📁 CONCORD — ESTRUTURA DE PASTAS PROPOSTA

> Evolução da estrutura atual (monolítica) para feature-based architecture

---

## 1. ESTRUTURA ATUAL (PROBLEMAS)

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── layout/          ← Auth + Layout (OK)
│   └── ui/              ← Design system (OK)
├── modules/
│   ├── chat/
│   │   └── ChatView.tsx     ← ❌ 1.502 LOC monolítico (12+ componentes inline)
│   ├── board/
│   │   └── BoardView.tsx    ← ❌ 882 LOC monolítico (5+ componentes inline)
│   └── pages/
│       └── PagesView.tsx    ← ❌ 788 LOC monolítico (7+ componentes inline)
├── stores/               ← 7 stores (OK, mas dual-mode incompleto)
├── services/             ← ❌ 100% dead code (nunca importado pelos stores)
├── infrastructure/       ← ❌ ws/client.ts nunca usado
├── hooks/                ← vazio
├── lib/                  ← utils (OK)
└── types/                ← 2 type systems conflitantes (models.ts vs api.types.ts)
```

**Problemas:**
1. God components (1.500+ LOC em um único arquivo)
2. Services layer 100% dead code
3. Dois type systems incompatíveis
4. Hooks folder vazio
5. Infrastructure layer parcialmente morta

---

## 2. ESTRUTURA PROPOSTA (FEATURE-BASED)

```
src/
├── app/                              # Entry point + routing
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # React entry
│   ├── index.css                     # Global styles + Tailwind
│   └── providers/                    # Context providers
│       ├── AuthProvider.tsx
│       ├── TenantProvider.tsx
│       ├── ThemeProvider.tsx
│       ├── WebSocketProvider.tsx
│       └── NotificationProvider.tsx
│
├── features/                         # Feature modules (bounded contexts)
│   │
│   ├── auth/                         # 🔐 Authentication
│   │   ├── components/
│   │   │   ├── AuthScreen.tsx        # Mode selection (from current)
│   │   │   ├── LoginForm.tsx         # Enterprise login
│   │   │   ├── RegisterForm.tsx      # Registration
│   │   │   ├── LegacyLogin.tsx       # Backward compat login
│   │   │   └── WorkspaceSetup.tsx    # First-run wizard
│   │   ├── hooks/
│   │   │   └── useAuth.ts           # Auth state + actions
│   │   ├── store.ts                  # Auth zustand store
│   │   └── index.ts                  # Barrel export
│   │
│   ├── chat/                         # 💬 Communication
│   │   ├── components/
│   │   │   ├── ChatView.tsx          # Main layout (compose only)
│   │   │   ├── ChannelSidebar/
│   │   │   │   ├── ChannelSidebar.tsx
│   │   │   │   ├── ChannelList.tsx
│   │   │   │   ├── ChannelItem.tsx
│   │   │   │   ├── VoicePanel.tsx
│   │   │   │   └── UserInfoPanel.tsx
│   │   │   ├── MessageArea/
│   │   │   │   ├── MessageList.tsx   # Virtual scrolling
│   │   │   │   ├── MessageBubble.tsx # Individual message
│   │   │   │   ├── MessageInput.tsx  # Input + attachments
│   │   │   │   ├── MessageActions.tsx # Edit/delete/pin/react
│   │   │   │   ├── MarkdownRenderer.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── ThreadPanel/
│   │   │   │   ├── ThreadPanel.tsx
│   │   │   │   └── ThreadMessage.tsx
│   │   │   ├── ChannelHeader.tsx
│   │   │   ├── MemberListPanel.tsx
│   │   │   ├── MembersModal.tsx
│   │   │   ├── PinnedMessages.tsx
│   │   │   ├── VoiceChannelView.tsx
│   │   │   └── SearchModal.tsx       # NEW: message search
│   │   ├── hooks/
│   │   │   ├── useMessages.ts        # Paginated messages
│   │   │   ├── useChannels.ts        # Channel management
│   │   │   ├── useTyping.ts          # Typing indicators
│   │   │   ├── useVoice.ts           # Voice state
│   │   │   └── useMentions.ts        # @mention autocomplete
│   │   ├── store.ts                  # Chat zustand store
│   │   ├── types.ts                  # Chat-specific types
│   │   └── index.ts
│   │
│   ├── board/                        # 📋 Kanban
│   │   ├── components/
│   │   │   ├── BoardView.tsx         # Main layout (compose only)
│   │   │   ├── BoardSidebar/
│   │   │   │   ├── BoardSidebar.tsx
│   │   │   │   ├── BoardList.tsx
│   │   │   │   └── BoardItem.tsx
│   │   │   ├── BoardCanvas/
│   │   │   │   ├── BoardCanvas.tsx   # Columns container + DnD context
│   │   │   │   ├── BoardColumn.tsx   # Single column
│   │   │   │   └── ColumnHeader.tsx
│   │   │   ├── Card/
│   │   │   │   ├── CardItem.tsx      # Card preview
│   │   │   │   ├── CardModal.tsx     # Full card editor
│   │   │   │   ├── CardDescription.tsx
│   │   │   │   ├── CardLabels.tsx
│   │   │   │   ├── CardAssignees.tsx
│   │   │   │   ├── CardChecklist.tsx
│   │   │   │   ├── CardComments.tsx
│   │   │   │   ├── CardAttachments.tsx # NEW
│   │   │   │   └── CardActivity.tsx    # NEW: history log
│   │   │   ├── Views/                  # NEW: alternate views
│   │   │   │   ├── ListView.tsx
│   │   │   │   ├── CalendarView.tsx
│   │   │   │   └── TimelineView.tsx
│   │   │   ├── BoardHeader.tsx
│   │   │   └── BoardFilters.tsx       # NEW
│   │   ├── hooks/
│   │   │   ├── useBoard.ts
│   │   │   ├── useCards.ts
│   │   │   ├── useDragDrop.ts
│   │   │   └── useFilters.ts
│   │   ├── store.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── pages/                        # 📝 Knowledge Base
│   │   ├── components/
│   │   │   ├── PagesView.tsx         # Main layout (compose only)
│   │   │   ├── PageSidebar/
│   │   │   │   ├── PageSidebar.tsx
│   │   │   │   ├── PageTree.tsx
│   │   │   │   ├── PageTreeItem.tsx
│   │   │   │   └── FavoritesList.tsx
│   │   │   ├── Editor/
│   │   │   │   ├── PageEditor.tsx    # TipTap editor wrapper
│   │   │   │   ├── EditorToolbar.tsx # Formatting toolbar
│   │   │   │   ├── BlockRenderer.tsx
│   │   │   │   ├── SlashMenu.tsx     # Slash commands
│   │   │   │   ├── CoverPicker.tsx
│   │   │   │   └── IconPicker.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── PageBreadcrumb.tsx
│   │   │   ├── VersionHistory.tsx    # NEW
│   │   │   └── TableOfContents.tsx   # NEW
│   │   ├── hooks/
│   │   │   ├── usePage.ts
│   │   │   ├── useBlocks.ts
│   │   │   └── useCollaboration.ts   # Yjs collaborative
│   │   ├── store.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── analytics/                    # 📊 Dashboard (NEW)
│   │   ├── components/
│   │   │   ├── AnalyticsView.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── ActivityChart.tsx
│   │   │   ├── TeamInsights.tsx
│   │   │   └── ExportButton.tsx
│   │   ├── hooks/
│   │   │   └── useMetrics.ts
│   │   ├── store.ts
│   │   └── index.ts
│   │
│   ├── timeline/                     # 🕐 Timeline (NEW)
│   │   ├── components/
│   │   │   ├── TimelineView.tsx
│   │   │   ├── TimelineEvent.tsx
│   │   │   └── TimelineFilters.tsx
│   │   ├── hooks/
│   │   │   └── useTimeline.ts
│   │   └── index.ts
│   │
│   ├── automations/                  # ⚡ Automations (NEW)
│   │   ├── components/
│   │   │   ├── AutomationList.tsx
│   │   │   ├── AutomationEditor.tsx
│   │   │   ├── TriggerPicker.tsx
│   │   │   └── ActionPicker.tsx
│   │   ├── hooks/
│   │   │   └── useAutomations.ts
│   │   ├── store.ts
│   │   └── index.ts
│   │
│   └── settings/                     # ⚙️ Settings
│       ├── components/
│       │   ├── SettingsView.tsx
│       │   ├── WorkspaceSettings.tsx
│       │   ├── UserProfile.tsx
│       │   ├── ThemePicker.tsx
│       │   ├── WallpaperPicker.tsx
│       │   ├── MemberManagement.tsx
│       │   └── IntegrationSettings.tsx
│       └── index.ts
│
├── shared/                           # Shared across features
│   │
│   ├── components/                   # Design System
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Toast.tsx
│   │   ├── ErrorBoundary.tsx         # NEW
│   │   ├── EmptyState.tsx            # NEW
│   │   ├── LoadingSpinner.tsx        # NEW
│   │   ├── ConfirmDialog.tsx         # NEW
│   │   ├── Dropdown.tsx              # NEW
│   │   ├── Tabs.tsx                  # NEW
│   │   └── index.ts
│   │
│   ├── hooks/                        # Shared hooks
│   │   ├── useDebounce.ts
│   │   ├── useClickOutside.ts
│   │   ├── useKeyboardShortcut.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── index.ts
│   │
│   ├── services/                     # API service layer
│   │   ├── api/
│   │   │   ├── auth.service.ts
│   │   │   ├── tenant.service.ts
│   │   │   ├── communication.service.ts
│   │   │   ├── workspace.service.ts
│   │   │   ├── knowledge.service.ts
│   │   │   ├── analytics.service.ts  # NEW
│   │   │   ├── automation.service.ts # NEW
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── stores/                       # Global stores
│   │   ├── navigation.store.ts
│   │   ├── theme.store.ts
│   │   ├── connection.store.ts
│   │   ├── notification.store.ts
│   │   └── index.ts
│   │
│   ├── lib/                          # Utilities
│   │   ├── api-client.ts             # HTTP client
│   │   ├── ws-client.ts              # WebSocket client
│   │   ├── cn.ts                     # Class names util
│   │   ├── utils.ts                  # General utils
│   │   ├── date.ts                   # Date formatting
│   │   ├── sounds.ts                 # Audio effects
│   │   └── notifications.ts         # Browser notifications
│   │
│   └── types/                        # Shared types
│       ├── models.ts                 # ← UNIFICAR com api.types.ts
│       └── index.ts
│
└── __tests__/                        # Test utilities
    ├── setup.ts
    ├── utils.tsx                     # render helpers
    └── mocks/
        ├── stores.ts
        └── services.ts
```

---

## 3. REGRAS DA ESTRUTURA

### Cada Feature Module DEVE ter:
```
feature/
├── components/    → React components (max 200 LOC each)
├── hooks/         → Custom hooks (data fetching, state logic)
├── store.ts       → Zustand store (feature-scoped)
├── types.ts       → Feature-specific types
└── index.ts       → Barrel export (public API)
```

### Regras de Import:
```
✅ feature/ → shared/           (features importam do shared)
✅ feature/ → feature/store.ts  (componentes importam do próprio store)
✅ shared/ → shared/            (shared importa de si mesmo)
❌ feature/ → outra feature/    (features NÃO importam entre si)
❌ shared/ → feature/           (shared NUNCA importa de feature)
```

### Cross-Feature Communication:
```typescript
// Via eventos globais (EventBus pattern)
import { eventBus } from '@/shared/lib/event-bus';

// Em feature/board:
eventBus.emit('card.completed', { cardId, workspaceId });

// Em feature/chat:
eventBus.on('card.completed', ({ cardId, workspaceId }) => {
  // Post message to workspace channel
});
```

---

## 4. BACKEND — ESTRUTURA ATUAL (JÁ IMPLEMENTADA)

```
backend/
├── prisma/
│   └── schema.prisma              # 24 tabelas definidas
├── src/
│   ├── main.ts                    # Bootstrap NestJS
│   ├── app.module.ts              # Root module
│   ├── common/
│   │   ├── decorators/            # @CurrentUser, @TenantId, @Roles
│   │   ├── guards/                # JwtAuthGuard, TenantGuard, RolesGuard
│   │   ├── interceptors/          # AuditInterceptor, TransformInterceptor
│   │   └── middleware/            # LoggerMiddleware, TenantMiddleware
│   ├── infrastructure/
│   │   ├── prisma/                # PrismaService + PrismaModule
│   │   └── redis/                 # RedisService + RedisModule
│   └── modules/
│       ├── auth/                  # 4 endpoints
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── strategies/jwt.strategy.ts
│       │   └── dto/
│       ├── tenant/                # 7 endpoints
│       │   ├── tenant.controller.ts
│       │   ├── tenant.service.ts
│       │   └── tenant.module.ts
│       ├── communication/         # 18 endpoints + WS gateway
│       │   ├── controllers/       # server, channel, message
│       │   ├── services/          # server, channel, message
│       │   ├── gateway/           # communication.gateway
│       │   └── communication.module.ts
│       ├── workspace/             # 22 endpoints
│       │   ├── controllers/       # board, card
│       │   ├── services/          # board, card, column
│       │   └── workspace.module.ts
│       ├── knowledge/             # 15 endpoints
│       │   ├── controllers/       # page, block
│       │   ├── services/          # page, block
│       │   └── knowledge.module.ts
│       └── websocket/             # WS gateway (realtime)
│           ├── websocket.gateway.ts
│           └── websocket.module.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Backend — Estrutura Proposta (Evolução)

```
backend/src/modules/
├── (existentes acima)
│
├── analytics/                     # NEW: Sprint 8
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   ├── metrics-aggregator.ts      # BullMQ processor
│   └── analytics.module.ts
│
├── automation/                    # NEW: Sprint 8
│   ├── automation.controller.ts
│   ├── automation.service.ts
│   ├── rule-engine.ts             # Trigger → Condition → Action
│   ├── processors/                # BullMQ job processors
│   │   ├── notification.processor.ts
│   │   ├── automation.processor.ts
│   │   └── webhook.processor.ts
│   └── automation.module.ts
│
├── timeline/                      # NEW: Sprint 8
│   ├── timeline.controller.ts
│   ├── timeline.service.ts
│   ├── event-collector.ts         # Listens to domain events
│   └── timeline.module.ts
│
├── webhook/                       # NEW: Sprint 8
│   ├── webhook.controller.ts
│   ├── webhook.service.ts
│   ├── webhook-delivery.service.ts
│   └── webhook.module.ts
│
├── file/                          # NEW: Sprint 3
│   ├── file.controller.ts
│   ├── file.service.ts            # S3/R2 upload
│   ├── file-processing.processor.ts # Image resize
│   └── file.module.ts
│
└── ai/                            # NEW: Sprint 8
    ├── ai.controller.ts
    ├── ai.service.ts              # OpenAI/Anthropic adapter
    ├── ai-rate-limiter.ts         # Per-plan rate limiting
    └── ai.module.ts
```
