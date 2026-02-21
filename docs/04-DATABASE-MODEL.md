# 📐 CONCORD — MODELO DE BANCO CONCEITUAL

> Evolução do schema Prisma para suportar todas as features do roadmap

---

## 1. SCHEMA ATUAL (24 tabelas) — JÁ IMPLEMENTADO

```
┌─────────────────────────────────────────────────────────────────┐
│ CORE                                                            │
│ ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌────────────┐ │
│ │ tenants  │──│ tenant_   │──│ users        │──│ sessions   │ │
│ │          │  │ users     │  │              │  │            │ │
│ └──────────┘  └───────────┘  └──────────────┘  └────────────┘ │
│ ┌──────────────┐  ┌──────────────────┐                        │
│ │ tenant_      │  │ audit_logs       │                        │
│ │ invites      │  │                  │                        │
│ └──────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ COMMUNICATION                                                    │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│ │ servers  │──│ channels │──│ messages │──│ reactions       │ │
│ │          │  │          │  │          │  │                 │ │
│ └──────────┘  └──────────┘  └──────────┘  └─────────────────┘ │
│ ┌──────────────────┐  ┌──────────────────┐                    │
│ │ channel_         │  │ mentions         │                    │
│ │ permissions      │  │                  │                    │
│ └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ WORKSPACE (KANBAN)                                               │
│ ┌──────────┐  ┌────────────┐  ┌──────┐  ┌──────────────────┐  │
│ │workspaces│──│ boards     │──│ board│──│ cards            │  │
│ │          │  │            │  │ cols │  │                  │  │
│ └──────────┘  └────────────┘  └──────┘  └──────────────────┘  │
│ ┌────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐ │
│ │ labels │  │ card_      │  │ card_    │  │ card_          │ │
│ │        │  │ assignments│  │ comments │  │ history        │ │
│ └────────┘  └────────────┘  └──────────┘  └────────────────┘ │
│ ┌────────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│ │ checklists     │──│ checklist_   │  │ card_attachments   │ │
│ │                │  │ items        │  │                    │ │
│ └────────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ KNOWLEDGE (PAGES)                                                │
│ ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────────┐ │
│ │ pages    │──│ blocks   │  │ page_        │  │ page_       │ │
│ │          │  │          │  │ versions     │  │ permissions │ │
│ └──────────┘  └──────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. NOVAS TABELAS PROPOSTAS (Sprints 3-8)

### Sprint 3-4: Kanban Avançado

```sql
-- Custom fields por board
CREATE TABLE board_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'text', 'number', 'date', 'select', 'multiselect'
    options JSONB, -- para select/multiselect: [{"value": "...", "color": "..."}]
    is_required BOOLEAN DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valores de custom fields por card
CREATE TABLE card_custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES board_custom_fields(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    UNIQUE(card_id, field_id)
);

-- Relações entre cards
CREATE TABLE card_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    target_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'blocks', 'blocked_by', 'related', 'duplicates'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_card_id, target_card_id, type)
);

-- Board templates
CREATE TABLE board_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL, -- serialized board structure
    is_system BOOLEAN DEFAULT false, -- pré-definidos vs custom
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Sprint 5: Chat Avançado

```sql
-- Direct Messages (conversations)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL, -- 'dm', 'group'
    name VARCHAR(100), -- para groups
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

-- Unread tracking per channel
CREATE TABLE channel_read_status (
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES messages(id),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    mention_count INTEGER DEFAULT 0,
    PRIMARY KEY (channel_id, user_id)
);

-- Link previews cache
CREATE TABLE link_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL UNIQUE,
    title VARCHAR(500),
    description TEXT,
    image_url TEXT,
    site_name VARCHAR(200),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);
```

### Sprint 8: Diferenciação

```sql
-- Timeline events (materialized from all modules)
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    workspace_id UUID,
    event_type VARCHAR(50) NOT NULL, -- 'message.created', 'card.moved', etc.
    module VARCHAR(20) NOT NULL, -- 'chat', 'board', 'pages'
    entity_id UUID NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    summary TEXT NOT NULL, -- human-readable summary
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_tenant_date 
    ON timeline_events(tenant_id, created_at DESC);
CREATE INDEX idx_timeline_workspace 
    ON timeline_events(workspace_id, created_at DESC);

-- Cross-module links
CREATE TABLE entity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL, -- 'message', 'card', 'page'
    source_id UUID NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id UUID NOT NULL,
    link_type VARCHAR(20) NOT NULL, -- 'created_from', 'references', 'documents'
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_type, source_id, target_type, target_id, link_type)
);

-- Automations
CREATE TABLE automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_type VARCHAR(50) NOT NULL, -- 'card.moved', 'message.created', etc.
    trigger_config JSONB NOT NULL, -- { "column_id": "...", "to_status": "done" }
    action_type VARCHAR(50) NOT NULL, -- 'send_message', 'create_card', 'notify'
    action_config JSONB NOT NULL, -- { "channel_id": "...", "template": "..." }
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    trigger_event JSONB NOT NULL,
    action_result JSONB,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'skipped'
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(200) NOT NULL, -- HMAC signing secret
    events TEXT[] NOT NULL, -- ['message.created', 'card.moved']
    is_active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    attempt INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL, -- 'pending', 'delivered', 'failed'
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature flags per tenant
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_global BOOLEAN DEFAULT false,
    default_value BOOLEAN DEFAULT false
);

CREATE TABLE tenant_feature_flags (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL,
    PRIMARY KEY (tenant_id, flag_id)
);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    key_hash VARCHAR(200) NOT NULL, -- SHA-256 of the actual key
    key_prefix VARCHAR(10) NOT NULL, -- first 8 chars for display
    permissions TEXT[] NOT NULL, -- ['read:messages', 'write:cards']
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics (daily aggregated metrics)
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    cards_created INTEGER DEFAULT 0,
    cards_completed INTEGER DEFAULT 0,
    pages_edited INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER, -- chat response time
    UNIQUE(tenant_id, date)
);
```

---

## 3. RESUMO DO SCHEMA FINAL

| Domínio | Tabelas Atuais | Tabelas Novas | Total |
|---------|---------------|---------------|-------|
| Core | 5 | 0 | 5 |
| Communication | 5 | 4 | 9 |
| Workspace (Kanban) | 10 | 4 | 14 |
| Knowledge (Pages) | 4 | 0 | 4 |
| System (novo) | 1 | 10 | 11 |
| **Total** | **25** | **18** | **43** |

### Evolução do Schema

```
v1 (atual)  → 24 tabelas │ MVP funcional
v2 (Sprint 3-5) → 33 tabelas │ Features profissionais
v3 (Sprint 8) → 43 tabelas │ Plataforma enterprise
```
