# 🔥 CONCORD — VERSÃO STARTUP GLOBAL (MODO AGRESSIVO)

> Proposta de diferenciação estratégica e modelo de negócio para posicionar o Concord como plataforma colaborativa global.

---

## 1. POSICIONAMENTO DE MERCADO

### O Problema que Resolvemos

As equipes modernas usam **6+ ferramentas separadas** para colaborar:
- Slack/Discord para comunicação
- Trello/Jira para gestão de tarefas
- Notion/Google Docs para documentação
- Google Analytics para métricas
- Zapier para automações
- ChatGPT para IA assistiva

**Resultado:** Contexto fragmentado, notificações espalhadas, informação perdida entre ferramentas, custo alto de licenças múltiplas.

### Nossa Tese

> **"Uma plataforma onde conversa, tarefa e documento vivem juntos — com inteligência para conectar tudo automaticamente."**

O Concord não é um clone de Slack + Trello + Notion. É uma **plataforma de contexto unificado** onde cada artefato (mensagem, card, documento) é cidadão de primeira classe e pode ser referenciado, vinculado e transformado em qualquer outro.

---

## 2. DIFERENCIAIS ESTRATÉGICOS

### 2.1 — Integração Nativa de Contexto

**O que nenhum concorrente faz:**

| Cenário | Ferramentas Separadas | Concord |
|---------|----------------------|---------|
| Dev reporta bug no chat | Copiar mensagem → Colar no Jira → Linkar de volta | Selecionar mensagem → "Criar Tarefa" → Card criado com link bidirecional |
| PM escreve spec | Criar doc no Notion → Copiar link → Colar no Jira | Abrir card → "Criar Documentação" → Page vinculada automaticamente |
| Designer entrega | Upload no Slack → Perder no histórico | Upload no chat → Anexo aparece no timeline do projeto |
| Reunião gera ações | Anotar no Google Docs → Copiar itens → Criar tasks | Página de meeting notes → Bloco "Action Item" → Cria card automaticamente |

### 2.2 — Cross-Linking Universal

```
Mensagem no chat:
"Atualizei o design do #card-237. Detalhes na #page-89."

→ #card-237 vira um link clicável que mostra preview do card
→ #page-89 vira um link clicável que mostra preview da página
→ Tudo indexado e buscável
```

### 2.3 — Timeline Unificada

Um feed cronológico que mostra TUDO que aconteceu no workspace:
- 🟦 `10:30` — João enviou mensagem em #general
- 🟩 `10:45` — Maria moveu card "Login Page" para In Progress
- 🟨 `11:00` — Pedro editou página "API Specification"
- 🟦 `11:15` — Ana mencionou @João em #dev-team
- 🟩 `11:30` — João completou card "Login Page"

Filtros: por módulo, por pessoa, por período, por workspace.

### 2.4 — Cards que Viram Documentos

- Todo card tem um botão "Expandir para Documento"
- Abre editor completo com a descrição do card + blocos adicionais
- Documento fica vinculado ao card
- Atualizações no doc aparecem no activity log do card

### 2.5 — Chat Vinculado a Tarefas

- Cada card tem uma "mini-thread" de chat
- Mensagens no chat podem ser convertidas em cards com um clique
- @mencionar um card no chat mostra status + assignee inline
- Automação: card movido para "Done" → mensagem automática no canal do projeto

### 2.6 — IA Nativa (Concord AI)

| Feature | Descrição |
|---------|-----------|
| **Resumo de Thread** | "Resuma as últimas 50 mensagens de #general" |
| **Card Description** | Auto-gera descrição de card baseada no título |
| **Meeting Notes** | Gera action items a partir de notas de reunião |
| **Smart Search** | Busca semântica: "quando discutimos sobre deploy?" |
| **Auto-Labels** | Sugere labels para cards baseado no conteúdo |
| **Auto-Assign** | Sugere assignee baseado em histórico |
| **Translation** | Traduz mensagens inline (equipes multilíngue) |
| **Document Draft** | Gera rascunho de spec baseado em conversas do chat |

---

## 3. MODELO SAAS

### 3.1 — Planos de Preço

| | **Free** | **Pro** | **Business** | **Enterprise** |
|---|---------|---------|-------------|---------------|
| **Preço** | $0 | $8/user/mês | $15/user/mês | Custom |
| **Usuários** | Até 10 | Até 50 | Ilimitado | Ilimitado |
| **Workspaces** | 1 | 5 | Ilimitado | Ilimitado |
| **Storage** | 2 GB | 20 GB | 100 GB | Ilimitado |
| **Mensagens** | 10k total | Ilimitado | Ilimitado | Ilimitado |
| **Boards** | 3 | 20 | Ilimitado | Ilimitado |
| **Pages** | 50 | 500 | Ilimitado | Ilimitado |
| **Histórico de mensagens** | 90 dias | 1 ano | Ilimitado | Ilimitado |
| **File upload** | 10 MB/arquivo | 50 MB/arquivo | 250 MB/arquivo | 1 GB/arquivo |
| **Integrações** | — | Webhooks | Webhooks + API | Full API + SAML |
| **AI** | — | 50 prompts/mês | 500 prompts/mês | Ilimitado |
| **Analytics** | Básico | Completo | Completo + Export | Custom dashboards |
| **Automações** | — | 5 regras | 50 regras | Ilimitado |
| **Suporte** | Community | Email (48h) | Chat (4h) | Dedicado + SLA |
| **SSO** | — | Google/GitHub | OIDC | SAML 2.0 |
| **Audit Log** | — | 30 dias | 1 ano | Ilimitado |
| **Custom Branding** | — | — | Logo + Cores | Full white-label |
| **Data Residency** | — | — | — | Multi-região |
| **Uptime SLA** | — | — | 99.5% | 99.99% |

### 3.2 — Estratégia de Crescimento

**Fase 1 — Product-Led Growth (Meses 1-6)**
- Free tier generoso para adoção viral
- Onboarding guiado com templates pré-prontos
- "Invite your team" como call-to-action principal
- Widget "Powered by Concord" no modo free
- SEO: blog com content sobre produtividade de equipes

**Fase 2 — Bottom-Up Adoption (Meses 6-12)**
- Time de vendas focado em converter Free → Pro
- Case studies com early adopters
- Webinars de boas práticas
- Marketplace de templates (boards, pages)
- Integrações com ferramentas populares (GitHub, Figma, Slack)

**Fase 3 — Enterprise Push (Meses 12-24)**
- Equipe de vendas enterprise
- POC program (30 dias grátis do Enterprise)
- Compliance: SOC 2 Type II, GDPR, HIPAA-ready
- Partner program (consultores de implementação)
- Multi-tenant administration console

### 3.3 — Estratégia de Retenção

| Mecanismo | Implementação |
|-----------|---------------|
| **Lock-in de dados** | Quanto mais dados, mais valioso — histórico, docs, cards |
| **Network effects** | Mais membros = mais valioso para todos |
| **Workflow habits** | Automações personalizadas criam dependência |
| **Integration depth** | Conexões com ferramentas externas aumentam switching cost |
| **AI personalization** | IA aprende padrões da equipe ao longo do tempo |
| **Notification hooks** | Notificações contextuals mantêm engagement diário |
| **Weekly digest** | Email semanal com métricas de produtividade |

### 3.4 — Estratégia de Diferenciação

| vs Slack | vs Trello | vs Notion |
|----------|-----------|-----------|
| Slack não tem boards nem docs | Trello não tem chat real-time | Notion não tem chat |
| Slack não tem timeline unificada | Trello não tem documentação | Notion boards são primitivos |
| Slack não converte msg → task | Trello não tem presença online | Notion não tem typing indicators |
| Slack não tem analytics nativos | Trello não tem AI assistiva | Notion real-time é instável |
| **Concord faz tudo em um** | **Concord integra com chat** | **Concord tem real-time nativo** |

---

## 4. MÉTRICAS DE NEGÓCIO (North Star)

### Primary Metric: **Weekly Active Collaborators (WAC)**
> Número de usuários que interagiram em ≥2 módulos diferentes na semana

### Secondary Metrics

| Métrica | Alvo Mês 6 | Alvo Mês 12 |
|---------|-----------|------------|
| **Registered users** | 5.000 | 50.000 |
| **Monthly Active Users** | 1.500 | 15.000 |
| **Weekly Active Collaborators** | 500 | 5.000 |
| **Paying teams** | 50 | 500 |
| **MRR** | $5.000 | $50.000 |
| **Churn rate** | <8% | <5% |
| **NPS** | >40 | >50 |
| **DAU/MAU ratio** | >30% | >40% |
| **Avg messages/user/day** | 10 | 20 |
| **Cross-module usage** | 30% | 50% |

### Product Health Metrics

| Métrica | Definição | Alvo |
|---------|-----------|------|
| **Time to First Value** | Registro → primeira mensagem enviada | <5 min |
| **Activation Rate** | % que completa onboarding (cria workspace + canal + mensagem) | >60% |
| **Feature Adoption** | % users que usam ≥3 features (chat + board + pages) | >25% |
| **Collaboration Depth** | Média de módulos usados por workspace | >2.0 |
| **Data Density** | Itens criados por workspace por mês | >100 |

---

## 5. PLANO DE EVOLUÇÃO 12 MESES

```
MÊS 1-2   │ ████████░░ │ Sprint 1-2: Fundação + SaaS infra
MÊS 3-4   │ ████████░░ │ Sprint 3-4: Kanban profissional + real-time
MÊS 5     │ █████░░░░░ │ Sprint 5: Chat avançado (threads, DMs, search)
MÊS 6     │ █████░░░░░ │ Sprint 6: Editor profissional (TipTap + CRDT)
           │            │
           │ ── LAUNCH v1.0 (Public Beta) ──
           │
MÊS 7     │ █████░░░░░ │ Sprint 7: Infra global + SSO + observability
MÊS 8     │ █████░░░░░ │ Sprint 8: Diferenciação (timeline, AI, automações)
           │            │
           │ ── LAUNCH v2.0 (General Availability) ──
           │
MÊS 9     │ ████░░░░░░ │ Mobile app (React Native / Expo)
MÊS 10    │ ████░░░░░░ │ Integrações (GitHub, Figma, Slack, Zapier)
MÊS 11    │ ████░░░░░░ │ Admin console + billing portal
MÊS 12    │ ████░░░░░░ │ API pública + marketplace + enterprise onboarding
           │            │
           │ ── v3.0 (Enterprise Ready) ──
```

### Marcos Críticos

| Marco | Data Alvo | Critério |
|-------|----------|----------|
| **Alpha interna** | Mês 2 | Equipe usando Concord enterprise internamente |
| **Closed Beta** | Mês 4 | 50 usuários externos testando |
| **Public Beta** | Mês 6 | Landing page + sign up aberto + free tier |
| **GA v1.0** | Mês 8 | Planos pagos ativos, billing funcional |
| **Enterprise v1** | Mês 12 | SSO, audit trail, compliance, primeiro cliente enterprise |

---

## 6. STACK TECNOLÓGICO COMPLETO

### Backend

| Componente | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| Runtime | Node.js 20 LTS | Ecossistema, performance async |
| Framework | NestJS 10 | Enterprise patterns, DI, modular |
| ORM | Prisma 5 | Type-safety, migrations, DX |
| Database | PostgreSQL 16 | ACID, full-text search, JSONB, extensions |
| Cache | Redis 7 (ioredis) | Sub-ms latency, pub/sub, sets |
| Queue | BullMQ 5 | Reliable jobs, retry, scheduling |
| Auth | Passport JWT + bcrypt | Industry standard |
| Validation | class-validator + class-transformer | DTO validation |
| Real-Time | Socket.IO 4.7 + Redis Adapter | WebSocket + fallback, horizontal scaling |
| File Storage | Cloudflare R2 (S3-compatible) | Cheap, no egress fees, edge |
| AI | OpenAI/Anthropic API | GPT-4o / Claude for completions |
| Email | Resend ou AWS SES | Transactional email |
| Search | PostgreSQL FTS (→ Elasticsearch later) | Starts simple, scales up |
| Monitoring | OpenTelemetry + Sentry | Traces, metrics, errors |
| Logging | Winston + JSON | Structured, parseable |

### Frontend

| Componente | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| Framework | React 18 → Next.js 14 (futuro) | SSR, routing, API routes |
| Language | TypeScript 5.5 | Type safety |
| State | Zustand 4 | Minimal, fast, middleware |
| Styling | Tailwind CSS 3.4 | Utility-first, treeshakeable |
| Icons | Lucide React | Consistent, tree-shakeable |
| Editor | TipTap (ProseMirror) | Extensible, collaborative |
| CRDT | Yjs | Conflict-free collaborative editing |
| DnD | @dnd-kit | Accessible, performant |
| Virtual Scroll | react-virtuoso | Large lists performance |
| Charts | Recharts ou Tremor | Dashboard analytics |
| Testing | Vitest + RTL + Playwright | Unit + integration + E2E |

### DevOps

| Componente | Tecnologia |
|-----------|-----------|
| Container | Docker + docker-compose |
| Orchestration | Kubernetes (→ quando escala) |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |
| Hosting | Render (início) → AWS/GCP (escala) |
| CDN | Cloudflare |
| DNS | Cloudflare |
| SSL | Let's Encrypt (auto-renew) |
| Secrets | GitHub Secrets → Vault (enterprise) |
