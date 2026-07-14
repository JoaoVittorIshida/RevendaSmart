# Plano 004: Reservar itens e destacar capital parado no estoque

> **Drift check:** `git diff --stat 8f7144d..HEAD -- backend/migrations backend/controllers/stockController.js backend/routes/stockRoutes.js src/contexts/DataContext.jsx src/pages/Estoque.jsx src/pages/Vendas.jsx database_schema.sql`

## Status

- **Prioridade:** P1
- **Esforço:** M
- **Risco:** MÉDIO
- **Depende de:** `plans/002-historico-imutavel-vendas.md`
- **Categoria:** direction
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Contexto e escopo

`estoque.status` hoje só aceita disponível, vendido e devolvido (`database_schema.sql:87`), e a listagem calcula custo total somente para itens disponíveis (`src/pages/Estoque.jsx:15-23`). Este plano adiciona reserva sem armazenar dados de comprador e torna visível dinheiro parado em itens não vendidos.

**Em escopo:** enum/colunas de reserva, endpoints, Estoque, bloqueios na Nova Venda e filtros/cálculos de idade. **Fora do escopo:** clientes, garantia, alertas de reposição, envio de notificações e job externo obrigatório.

## Passos

### 1. Adicionar reserva por migration aditiva

Inclua `reservado` no status de estoque e colunas `reservado_ate` e `reserva_observacao` (curta, opcional). Adicione índice por `usuario_id`, status e data de entrada, e índice para reservas por vencimento. Não altere nem recalcule status existentes.

**Verifique:** contagens por status antes/depois são iguais para os três estados antigos; uma linha de teste reservada guarda data e observação.

### 2. Criar transições de estado no servidor

Implemente reservar, liberar e venda confirmada. Só item disponível pode ser reservado; só item reservado/disponível pode ser vendido conforme decisão explícita de UX; venda deve limpar os campos de reserva. Itens reservados não entram na seleção de unidades em `Vendas.jsx:32-34`. Não grave nome ou contato do comprador.

Defina vencimento como sinal visual, não mudança automática inicial: itens vencidos continuam reservados até o usuário liberar. Isto evita job agendado e liberações inesperadas.

**Verifique:** usuário A não manipula item de B; reservar bloqueia venda pelo fluxo padrão; liberar reabilita venda.

### 3. Expor idade e capital no Estoque

No backend ou em seletor puro testável, calcule dias desde `data_entrada` e custo acumulado de itens disponíveis e reservados. Na tela Estoque, adicione filtros: todos, disponíveis, reservados, 30+, 60+ e 90+ dias. Exiba valor total imobilizado e destaque discreto para faixas de idade; não use alertas intrusivos.

**Verifique:** item de 31 dias aparece em 30+, item vendido não compõe capital imobilizado, e item reservado aparece no filtro de reserva.

## Testes

- Matriz de transições disponível/reservado/vendido e tentativas inválidas.
- Isolamento multi-tenant para os endpoints de reserva.
- Cálculo de idade nas fronteiras 30, 60 e 90 dias usando data fixa.

## Critérios de pronto

- [ ] Reservas não exigem dados de cliente.
- [ ] Item reservado não é anunciado como disponível nem vendido no fluxo padrão.
- [ ] Capital imobilizado ignora itens vendidos e inclui reservados de forma identificável.
- [ ] Nenhum status histórico foi alterado pela migration.

## STOP conditions

- Pare se alterar o enum exigir recriar tabela no provedor atual; crie migration compatível e valide em clone.
- Pare se `data_entrada` tiver valores nulos/inválidos que impeçam a classificação sem inferência.

## Manutenção

Ao adicionar novos estados no futuro, centralize a máquina de estados no backend e atualize a Vitrine e Análises ao mesmo tempo.
