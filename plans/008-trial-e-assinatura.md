# Plano 008: Preparar trial e assinatura de plano único

> **Drift check:** `git diff --stat 8f7144d..HEAD -- backend/migrations backend/controllers/authController.js backend/middleware backend/routes src/contexts/AuthContext.jsx src/App.jsx README.md`

## Status

- **Prioridade:** P3
- **Esforço:** L
- **Risco:** ALTO — acesso pago e integração financeira.
- **Depende de:** `plans/001-migrations-seguras.md`, `plans/007-portabilidade-e-backup.md`
- **Categoria:** direction/security
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Contexto e escopo

O sistema terá um plano pago único após trial, não uma hierarquia artificial de recursos. Hoje `usuarios` só possui nome, login, senha e criação (`database_schema.sql:136-144`); não há e-mail, plano, entitlement ou webhook de cobrança. A preparação deve existir antes de escolher/provisionar o gateway.

**Em escopo:** modelo de assinatura/trial, autorização centralizada, tela de status e design de integração idempotente. **Fora do escopo:** definir preço, cartão/PIX real, múltiplos planos, marketplace e bloquear exportação dos dados do usuário.

## Passos

### 1. Definir estados de acesso antes do gateway

Crie migration para email verificado/opcional conforme decisão de produto e tabelas `assinaturas`/`eventos_cobranca` com identificador externo, estado (`trial`, `ativa`, `atrasada`, `cancelada`, `expirada`), início/fim de acesso e timestamps. Defina formalmente o estado que pode acessar o aplicativo: trial válida ou assinatura ativa. Guarde eventos recebidos por ID único para idempotência.

**Verifique:** uma assinatura de teste pode mudar de trial para ativa e para expirada sem alterar dados de negócio.

### 2. Centralizar autorização no backend

Depois de validar JWT, crie middleware que consulta/resolve entitlement do usuário e protege as rotas de negócio. Mantenha endpoints de autenticação, status de assinatura, exportação/backup e suporte acessíveis conforme a política documentada. Nunca trate bloqueio no frontend como segurança; o backend deve negar rotas protegidas com resposta clara de assinatura.

**Verifique:** usuário expirado recebe bloqueio em endpoint de estoque, mas ainda consegue baixar backup; usuário ativo continua isolado por `usuario_id`.

### 3. Expor estado no frontend sem quebrar sessão

Amplie a resposta de verificação de sessão ou crie endpoint de conta para informar estado, fim do trial e motivo de bloqueio. Mostre banner/tela de assinatura quando necessário; preserve logout, tema e acesso à exportação. Não introduza tela de pagamento falsa.

**Verifique:** estados trial, ativa e expirada apresentam mensagens distintas e não deixam páginas privadas renderizarem dados quando o servidor negar acesso.

### 4. Selecionar gateway e implementar webhooks em plano separado de integração

Antes de aceitar pagamento, escolha um gateway que suporte cobrança recorrente e webhook no país de operação. Escreva um mini-ADR com eventos necessários, assinaturas de webhook, política de retry, cancelamento e conciliação. Somente então implemente rota de webhook com verificação de assinatura, idempotência em `eventos_cobranca`, logs sem dados sensíveis e testes com eventos oficiais do gateway.

**Verifique:** o mesmo evento de teste entregue duas vezes não altera duas vezes a assinatura; evento sem assinatura válida é recusado.

## Testes

- Máquina de estados de assinatura e transições inválidas.
- Middleware de backend para ativo, trial, expirado e usuário inexistente.
- Exportação permitida quando o produto estiver bloqueado.
- Webhook idempotente e assinatura inválida, após escolha do gateway.

## Critérios de pronto

- [ ] Existe somente um conceito comercial de plano pago, com trial configurável.
- [ ] Entitlement é aplicado no servidor.
- [ ] Usuário bloqueado mantém acesso à exportação/backup.
- [ ] Nenhum segredo de gateway é exposto no frontend, logs ou repositório.
- [ ] Webhook só entra depois de decisão explícita de gateway.

## STOP conditions

- Pare se for necessário escolher preço, período de trial ou gateway sem decisão do responsável.
- Pare se o gateway escolhido não oferecer verificação de webhook e idempotência adequadas.
- Pare se o bloqueio impedir o usuário de exportar os próprios dados.

## Manutenção

Evite criar limites de produtos/vendas sem evidência de produto. O valor do plano é a plataforma completa e simples; entitlements futuros devem passar pelo mesmo middleware.
