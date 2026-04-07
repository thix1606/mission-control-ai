# 🚀 Mission Control AI

Painel de controle para orquestração de agentes de IA e automações.
Construído com **React + Vite + TypeScript + Tailwind CSS**.

---

## 📋 Sumário

- [Como rodar localmente](#como-rodar-localmente)
- [Arquitetura de pastas](#arquitetura-de-pastas)
- [Dados mockados — onde estão e como substituir](#dados-mockados)
- [Telas disponíveis](#telas-disponíveis)

---

## Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [pnpm](https://pnpm.io/) (recomendado) **ou** npm/yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/thix1606/mission-control-ai.git
cd mission-control-ai

# 2. Instale as dependências
pnpm install
# ou: npm install

# 3. Inicie o servidor de desenvolvimento
pnpm dev
# ou: npm run dev
```

O projeto vai abrir em `http://localhost:5173`.

### Build para Produção

```bash
# Gera os arquivos estáticos na pasta /dist
pnpm build

# Pré-visualizar o build localmente
pnpm preview
```

---

## Arquitetura de Pastas

```
src/
├── components/          # Componentes reutilizáveis de UI
│   ├── KanbanCard.tsx   # Card individual do quadro Kanban
│   ├── PageHeader.tsx   # Cabeçalho padrão de cada tela
│   ├── Sidebar.tsx      # Menu lateral de navegação
│   └── StatusBadge.tsx  # Badge colorido de status (Online/Ocioso/Offline)
│
├── data/                # ⚠️ DADOS MOCKADOS — veja seção abaixo
│   ├── mockAgents.ts    # Lista de agentes de IA
│   ├── mockChannels.ts  # Lista de canais de comunicação
│   ├── mockTasks.ts     # Tarefas do quadro Kanban
│   └── mockTelemetry.ts # Métricas de consumo dos modelos de IA
│
├── hooks/               # Hooks React customizados
│   ├── useClock.ts      # Relógio em tempo real (atualiza a cada segundo)
│   └── useWeather.ts    # Clima via Geolocalização + Open-Meteo API
│
├── pages/               # Telas da aplicação (uma por rota)
│   ├── StatusPage.tsx        # Tela 1: Status de agentes e canais
│   ├── OrchestrationPage.tsx # Tela 2: Kanban de tarefas
│   └── TelemetryPage.tsx     # Tela 3: Métricas, relógio e clima
│
├── types/
│   └── index.ts         # Interfaces TypeScript globais (Agent, Task, etc.)
│
├── App.tsx              # Roteamento principal (BrowserRouter + Routes)
└── main.tsx             # Ponto de entrada da aplicação
```

### Analogia para quem vem do .NET/Java

| Conceito Front-end | Equivalente Back-end |
|--------------------|----------------------|
| `pages/`           | Controllers          |
| `components/`      | Partial Views / Fragments |
| `hooks/`           | Services             |
| `data/` (mocks)    | Repositórios em memória |
| `types/`           | DTOs / Interfaces    |
| `App.tsx`          | Startup / RouteConfig |

---

## Dados Mockados

> **Esta seção é a mais importante para quando você conectar seu backend .NET ou Java.**

Todos os dados estáticos vivem na pasta `src/data/`. Cada arquivo tem um comentário
explicando qual endpoint REST deverá substituí-lo no futuro.

### Onde cada dado é exibido

| Arquivo | Tela | Dado exibido |
|---------|------|--------------|
| `src/data/mockAgents.ts` | Tela de Status | Tabela de agentes de IA |
| `src/data/mockChannels.ts` | Tela de Status | Tabela de canais de comunicação |
| `src/data/mockTasks.ts` | Tela de Orquestração | Cards do Kanban |
| `src/data/mockTelemetry.ts` | Tela de Telemetria | Tabela de consumo por modelo |

### Como substituir um mock por uma API real

**Exemplo: trocar `mockAgents` por uma chamada ao seu backend .NET**

1. Abra `src/pages/StatusPage.tsx`
2. Remova a importação do mock:
   ```ts
   // REMOVA esta linha:
   import { mockAgents } from '../data/mockAgents';
   ```
3. Adicione um `useEffect` com `fetch`:
   ```tsx
   import { useState, useEffect } from 'react';
   import { Agent } from '../types';

   // Dentro do componente StatusPage:
   const [agents, setAgents] = useState<Agent[]>([]);

   useEffect(() => {
     fetch('https://sua-api.com/api/v1/agents')
       .then((res) => res.json())
       .then((data) => setAgents(data));
   }, []);
   ```
4. Substitua `mockAgents` por `agents` no JSX da tabela.

> 💡 **Dica:** Os tipos em `src/types/index.ts` descrevem exatamente a estrutura esperada.
> Garanta que o JSON retornado pelo seu backend tenha os mesmos campos.

### Dados que **não** vêm de mocks

| Dado | Fonte | Arquivo |
|------|-------|---------|
| Relógio em tempo real | `new Date()` local | `src/hooks/useClock.ts` |
| Clima atual | API pública [Open-Meteo](https://open-meteo.com/) + geolocalização do browser | `src/hooks/useWeather.ts` |

Esses dois não precisam de alteração para produção — já consomem APIs reais.

---

## Telas Disponíveis

### 1. `/` — Status (Agentes e Canais)
- Cards de resumo: agentes online / ociosos / offline
- Tabela de agentes com modelo, status e última atividade
- Tabela de canais com tipo, status e volume de mensagens

### 2. `/orchestration` — Orquestração (Kanban)
- 4 colunas: Fila de Espera / Em Processamento / Concluído / Falha
- Cards com nome da tarefa, agente responsável e prioridade

### 3. `/telemetry` — Telemetria
- Relógio em tempo real com data por extenso
- Clima local via geolocalização (requer permissão do browser)
- Resumo de custo total e requests
- Tabela de consumo por modelo (tokens, percentual de uso, custo em USD)

---

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | Framework UI |
| TypeScript | 5 | Tipagem estática |
| Vite | 8 | Build tool + dev server |
| Tailwind CSS | 4 | Estilização |
| React Router | 7 | Roteamento client-side |
| Lucide React | latest | Ícones |
| Open-Meteo | API pública | Dados de clima |

---

## Contribuindo

```bash
# Crie uma branch para sua feature
git checkout -b feature/nome-da-feature

# Faça suas alterações e commit
git add .
git commit -m "feat: descrição da mudança"

# Push e abra um Pull Request
git push origin feature/nome-da-feature
```

---

*Desenvolvido por Transinha — Agente de IA especialista em desenvolvimento web.*
