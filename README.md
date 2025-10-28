# pao do mauro — Sistema de Organização Empresarial

Gestão integrada para padarias artesanais, cobrindo pipeline completo de Vendas → Produção → Estoque → Financeiro → Relatórios, com autenticação segura e pronto para deploy na Render.

## Principais recursos

- **Next.js 14 (App Router, TypeScript)** com renderização híbrida e PWA.
- **Prisma + PostgreSQL** com modelos empresariais, UUID, enums e views analíticas para Power BI.
- **NextAuth** com login por e-mail/senha, bloqueio progressivo, 2FA TOTP com backup codes e rotação de cookies segura.
- **Tailwind CSS + shadcn/ui** com tema responsivo, dark mode e componentes acessíveis.
- **Segurança reforçada**: CSP estrita, headers do tipo helmet, rate limit por IP, proteção CSRF, cookies `HttpOnly`/`Secure` e sanitização com Zod.
- **Módulos completos** para pedidos, produção, estoque, receitas/BOM, finanças e relatórios com exportação CSV.
- **PWA** com manifest, service worker e suporte offline básico para lançamentos.
- **Logs estruturados** com Pino e endpoint `/api/health` para monitoramento.
- **Testes** com Vitest (custo, rate limit, utilitários WhatsApp).

## Estrutura do projeto

```
├── prisma
│   ├── schema.prisma          # Modelos, enums e relações
│   ├── seed.ts                # Seed com dados realistas
│   └── views.sql              # Views analíticas (dim_date, fatos)
├── src
│   ├── app                    # Rotas App Router (auth, dashboard, módulos, APIs)
│   ├── components             # UI shadcn, formulários e widgets
│   ├── lib                    # Prisma client, auth, segurança, cálculos, utils
│   ├── service-worker.ts      # Service worker customizado (PWA)
│   └── manifest.webmanifest   # Manifest PWA
├── tests                      # Testes unitários com Vitest
├── render.yaml                # Infra Render (web + Postgres)
├── Dockerfile                 # Build multi-stage Node 20
└── README.md
```

## Requisitos de ambiente

- Node.js 20+
- PostgreSQL 14+
- Variáveis definidas (ver `.env.example`).

## Configuração local

1. **Instalar dependências**
   ```bash
   npm ci
   ```
2. **Gerar Prisma Client**
   ```bash
   npx prisma generate
   ```
3. **Executar migrações**
   ```bash
   npx prisma migrate dev
   ```
4. **Popular banco com seed**
   ```bash
   npm run prisma:seed
   ```
   A senha do admin (`admin@paodomauro.com`) é exibida no console e deve ser trocada no primeiro acesso.
5. **Iniciar ambiente de desenvolvimento**
   ```bash
   npm run dev
   ```

## Fluxo de autenticação

- Login com e-mail/senha (bcrypt, política de 8+ caracteres) e bloqueio progressivo após falhas.
- 2FA TOTP opcional:
  1. Acesse **Configurações → Ativar 2FA TOTP** e gere o QR code/segredo.
  2. Escaneie no app autenticador e armazene os **códigos de backup** exibidos (utilizáveis uma única vez cada).
  3. No login, informe o código TOTP ou um backup válido.

## Módulos principais

- **Dashboard**: cards operacionais e gráfico de vendas (últimos 7 dias).
- **Pedidos**: CRUD completo, funil por status, geração de mensagem WhatsApp e integração com caixa ao marcar como pago.
- **Produção**: planejamento padrão (200 unidades), abertura/fechamento de lotes com baixa proporcional de insumos.
- **Estoque**: visão de níveis críticos, lançamentos `IN/OUT/ADJ`, custo médio móvel e sugestão de reposição.
- **Produtos & Receitas**: cadastro com precificação sugerida e BOM detalhada.
- **Financeiro**: lançamentos no cashbook, despesas e saldo diário por método de pagamento.
- **Relatórios**: lucro mensal, exportação CSV e instruções Power BI (views SQL prontas).
- **Configurações**: overhead por insumo fixo, usuários/2FA e string de conexão read-only.

## Testes

Execute os testes unitários:

```bash
npm run test
```

Cobertura atual: cálculos de overhead, rate limit e geração de mensagens WhatsApp.

## Deploy na Render

1. Crie um serviço **Web Service** apontando para o repositório. A Render lerá `render.yaml`, construirá com `npm ci && npx prisma generate && npm run build` e iniciará com `npm run start`.
2. Crie um banco **PostgreSQL** (starter) e associe via `DATABASE_URL` (já referenciado no YAML).
3. Defina `NEXTAUTH_URL` com a URL pública, e gere `NEXTAUTH_SECRET` (Render gera automaticamente via `generateValue: true`).
4. Ajuste rate limit (`RATE_LIMIT_*`) ou custos overhead via variáveis de ambiente, se necessário.

## Integração Power BI

- Utilize o usuário read-only do PostgreSQL (recomenda-se criar manualmente) e consuma as views presentes em `prisma/views.sql` (`dim_date`, `v_fct_sales`, `v_fct_production`, `v_fct_inventory`, `v_fct_expenses`, `v_fct_cashbook`).
- As views são criadas via `psql -f prisma/views.sql` após aplicar migrações.

## Scripts úteis

- `npm run dev` — modo desenvolvimento.
- `npm run build` — build de produção (Next standalone + PWA).
- `npm run start` — inicia o servidor de produção.
- `npm run prisma:migrate` — aplica migrações em ambiente produtivo.
- `npm run prisma:seed` — popula dados de demonstração.
- `npm run test` — Vitest.

## Licença

[MIT](./LICENSE) © 2024 — pao do mauro
