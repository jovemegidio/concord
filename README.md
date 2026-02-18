<div align="center">

# ⚡ Concord

### O workspace que une chat, boards e documentos em um só lugar.

*Inspirado no Discord, Trello e Notion — construído do zero com React, TypeScript e muita dedicação.*

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-764ABC?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-ff6b35?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layout-grid.svg" width="100" alt="Concord Logo" />

<br/><br/>

**[🚀 Rodar Localmente](#-instalação)** · **[🏗️ Arquitetura](#%EF%B8%8F-arquitetura)** · **[🧰 Stack](#-stack-tecnológica)** · **[🤝 Contribuir](#-contribuindo)**

</div>

---

## 💭 A Ideia

Sempre admirei como ferramentas como Discord, Trello e Notion resolvem problemas complexos com interfaces elegantes. Quis entender como funciona por dentro — não apenas consumir, mas **construir**.

O **Concord** nasceu desse desejo. É um projeto de portfólio, sim, mas é também uma prova de que **conceitos difíceis se aprendem fazendo**. Cada componente, cada store, cada animação foi pensado para refletir como aplicações reais são construídas em produção.

---

## 🎯 O que é o Concord?

Uma aplicação web completa que combina três produtos em um workspace unificado:

| Módulo | Inspiração | O que faz |
|--------|-----------|-----------|
| 💬 **Chat** | Discord | Mensagens em tempo real, canais de voz, reações, markdown, lista de membros |
| 📋 **Boards** | Trello | Quadros Kanban, drag & drop, etiquetas, checklists, prioridades, responsáveis |
| 📝 **Pages** | Notion | Editor de blocos, hierarquia de páginas, imagens de capa, múltiplos tipos de conteúdo |

---

## ✨ Funcionalidades

### 🌐 Plataforma
- **Sincronização em tempo real** via WebSocket — abra em vários dispositivos e veja tudo atualizado
- **Sync entre abas** com BroadcastChannel API
- **5 temas visuais**: Dark, Midnight, Light, Forest, Sunset
- **Persistência local** em localStorage + persistência no servidor com JSON
- **Sistema de login** com 4 usuários pré-configurados
- **Acesso pela internet** via LocalTunnel integrado

### 💬 Chat (Discord)
- Canais de texto e voz organizados por workspace
- Interface de voz com entrar/sair, mutar, ensurdecer e indicadores de fala
- **Sons de conexão** ao entrar, sair e mutar (Web Audio API)
- Reações com emoji nas mensagens
- Fixar mensagens importantes
- Indicadores de digitação em tempo real
- Renderização de **markdown** (negrito, itálico, riscado, código, links)
- Agrupamento inteligente de mensagens por autor e horário
- **Lista de membros** com status online/offline
- **Perfil editável**: nome, avatar, banner, status personalizado, sobre mim
- **Configurações do servidor**: nome, ícone, descrição, banner, gerenciamento de membros
- Menu de contexto nos canais (clique direito)

### 📋 Boards (Trello)
- Múltiplos quadros com colunas customizáveis
- Drag & drop fluido de cartões entre colunas
- Sistema de etiquetas coloridas
- Checklists com progresso visual
- 5 níveis de prioridade (Urgente → Nenhuma)
- **Seletor de responsáveis** — atribua membros aos cartões
- **Data de entrega** com indicador de atraso
- Comentários nos cartões
- Descrições detalhadas

### 📝 Pages (Notion)
- Editor de blocos com 12+ tipos de conteúdo
- Parágrafos, títulos (H1–H3), listas, checklists
- Blocos de código, citações, separadores, callouts, imagens
- Blocos colapsáveis (toggle)
- **Imagens de capa** — adicionar, trocar e remover
- Ícones customizáveis por página (emoji picker)
- Árvore hierárquica de páginas na sidebar
- Sistema de favoritos
- Criação de sub-páginas

### 🎨 Interface
- Design system próprio com componentes reutilizáveis (Avatar, Button, Modal, Badge, Input)
- CSS custom properties para temas dinâmicos
- Animações e transições suaves
- Layout responsivo e scrollbars customizadas
- Tooltips e menus contextuais

---

## 🏗️ Arquitetura

```
src/
├── components/
│   ├── ui/                     # Design system (Avatar, Button, Modal, Badge, Input)
│   └── layout/                 # Layout principal, sidebar, modais de perfil/workspace
├── modules/
│   ├── chat/                   # Módulo Discord (ChatView)
│   ├── board/                  # Módulo Trello (BoardView)
│   └── pages/                  # Módulo Notion (PagesView)
├── stores/
│   ├── chat.store.ts           # Auth, workspaces, canais, mensagens, voz
│   ├── board.store.ts          # Boards, colunas, cartões, labels, checklists
│   ├── pages.store.ts          # Páginas, blocos, favoritos
│   ├── navigation.store.ts     # Navegação entre módulos e elementos ativos
│   ├── theme.store.ts          # Temas e preferências visuais
│   └── sync.middleware.ts      # WebSocket manager + BroadcastChannel
├── lib/
│   ├── sounds.ts               # Sons de UI via Web Audio API
│   ├── cn.ts                   # Utilitário de classes CSS (clsx)
│   └── utils.ts                # Formatação de datas, helpers
├── types/
│   └── models.ts               # Interfaces TypeScript (User, Workspace, Channel, etc.)
├── hooks/                      # Custom React hooks
├── App.tsx                     # Componente raiz com roteamento
└── main.tsx                    # Entry point

server/
├── index.cjs                   # Express + WebSocket + LocalTunnel + persistência JSON
├── launch.cjs                  # Script para abrir no navegador
└── create-shortcut.cjs         # Cria atalho na área de trabalho
```

### Decisões Técnicas

| Decisão | Por quê |
|---------|---------|
| **Zustand + Immer** | State management simples e imutável, sem boilerplate do Redux |
| **WebSocket relay** | Sincronização real-time entre múltiplos clientes sem banco de dados |
| **CSS Custom Properties** | Troca de temas instantânea sem re-render |
| **BroadcastChannel API** | Sync entre abas do mesmo navegador sem servidor |
| **Web Audio API** | Sons de interface sem arquivos de áudio externos |
| **Colocation** | Cada módulo (chat/board/pages) é autocontido |

---

## 🚀 Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Rodando o projeto

```bash
# 1. Clone o repositório
git clone https://github.com/jovemegidio/concord.git
cd concord

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento (frontend)
npm run dev

# 4. Em outro terminal, inicie o servidor WebSocket
npm run server
```

O frontend estará em **http://localhost:3000** e o servidor WebSocket em **http://localhost:3001**.

### Modo produção

```bash
# Build + servidor em um comando
npm start
```

O `npm start` faz o build do frontend e sobe o servidor Express que serve os arquivos estáticos + WebSocket na mesma porta (3001). Um link LocalTunnel é gerado automaticamente para acesso pela internet.

### Login

O app possui 4 usuários pré-configurados. Use qualquer um deles para fazer login:

| Usuário | Senha |
|---------|-------|
| Gidão | `Concordbot` |
| Isadora | `Concordbot` |
| Ranniere | `Concordbot` |
| Isaac | `Concordbot` |

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o Vite dev server (porta 3000) |
| `npm run server` | Inicia o servidor WebSocket (porta 3001) |
| `npm run build` | Type-check + build de produção |
| `npm start` | Build + servidor em produção |
| `npm run type-check` | Verifica tipos TypeScript |
| `npm run lint` | Roda o ESLint |
| `npm run preview` | Preview do build de produção |
| `npm run launch` | Abre o app no navegador |

---

## 🧰 Stack Tecnológica

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| [React](https://react.dev) | 18.3 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5.5 | Tipagem estática |
| [Vite](https://vitejs.dev) | 5.4 | Build tool e dev server |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Utility-first CSS |
| [Zustand](https://zustand-demo.pmnd.rs) | 4.5 | State management |
| [Immer](https://immerjs.github.io/immer/) | 10.1 | Immutable state updates |
| [Lucide React](https://lucide.dev) | 0.424 | Ícones SVG |
| [date-fns](https://date-fns.org) | 3.6 | Formatação de datas |
| [Express](https://expressjs.com) | 4.22 | Servidor HTTP |
| [ws](https://github.com/websockets/ws) | 8.19 | WebSocket server |
| [nanoid](https://github.com/ai/nanoid) | 5.0 | Geração de IDs únicos |
| [LocalTunnel](https://theboroer.github.io/localtunnel-www/) | 2.0 | Exposição do servidor à internet |

---

## 🌍 Deploy

O projeto inclui configuração pronta para deploy no [Render](https://render.com):

```yaml
# render.yaml já configurado na raiz
services:
  - type: web
    name: concord
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: node server/index.cjs
```

Basta conectar o repositório no Render e ele faz o deploy automaticamente.

---

## 📁 Sobre a Estrutura

O código foi organizado pensando em **escalabilidade e manutenibilidade**:

- **Módulos isolados** — cada feature (chat, board, pages) vive em sua pasta
- **Stores separadas** — cada domínio tem sua própria store Zustand
- **Design system** — componentes de UI reutilizáveis e consistentes
- **Types centralizados** — todas as interfaces em um lugar só
- **Sync layer** — middleware de sincronização desacoplado do resto

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Se quiser melhorar algo:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

<div align="center">

Feito com 💜 por [**Gidão**](https://github.com/jovemegidio)

*"O melhor jeito de aprender a construir é construindo."*

⭐ Se esse projeto te ajudou ou inspirou, deixa uma estrela!

</div>
