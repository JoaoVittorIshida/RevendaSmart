# Plano 005: Manter dashboard enxuto e criar análises de revenda

> **Drift check:** `git diff --stat 8f7144d..HEAD -- src/App.jsx src/pages/Dashboard.jsx src/contexts/DataContext.jsx backend/routes backend/controllers`

## Status

- **Prioridade:** P2
- **Esforço:** M
- **Risco:** MÉDIO
- **Depende de:** `plans/003-venda-com-taxas-opcionais.md`, `plans/004-reservas-e-estoque-parado.md`
- **Categoria:** direction
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Contexto e escopo

O dashboard já contém quatro KPIs e diversos gráficos (`src/pages/Dashboard.jsx:270-395`). Ele não deve crescer indefinidamente. As métricas precisam usar vendas líquidas e separar decisão diária de análise histórica.

**Em escopo:** Dashboard, nova rota/página `Analises`, endpoint agregado paginado/filtrado e testes de cálculo. **Fora do escopo:** BI genérico, comparativos de mercado, previsões e finanças fora de vendas/estoque.

## Passos

### 1. Criar uma única camada de métricas no servidor

Adicione endpoint autenticado de métricas com período explícito e timezone definida. Ele deve retornar: lucro líquido do mês, receita líquida do mês, unidades vendidas, capital em estoque, quantidade de itens 30+/60+/90+ dias, giro médio (dias entre entrada e venda), ranking por lucro e ranking por velocidade de venda, além de canais. Use queries agregadas e filtros `usuario_id`; não carregue todo o histórico no navegador para recalcular.

**Verifique:** dados de dois usuários não se misturam e venda cancelada não entra em totais/rankings.

### 2. Reduzir o dashboard a decisões do mês

Mantenha quatro cards: lucro líquido do mês, receita líquida do mês, capital imobilizado e itens parados há 30+ dias. Mantenha tendência mensal e vendas recentes, removendo somente gráficos redundantes após comparar com a nova página. Preserve tema, componentes e classes já usados.

**Verifique:** sem dados, todos os cards mostram zero/estado vazio; período padrão é mês atual e pode ser alterado sem erro de fuso.

### 3. Criar aba Análises

Inclua em `src/App.jsx` uma rota e navegação “Análises”. Agrupe ali giro médio, itens mais lucrativos, itens vendidos mais rapidamente, desempenho por canal e evolução por período. Mostre explicação curta para cada métrica, principalmente que lucro é líquido menos custo do item.

**Verifique:** a navegação funciona em desktop e mobile; tabelas/gráficos exibem estado vazio e filtros de período.

## Testes

- Testes de query/serviço com vendas concluídas, canceladas, frete/taxa e estoque reservado.
- Testes de datas com venda no limite de virada de mês e data de entrada de 30 dias.
- Teste de renderização de estado vazio.

## Critérios de pronto

- [ ] Dashboard não contém métricas profundas duplicadas.
- [ ] Toda receita/lucro usa `valor_liquido` de venda concluída.
- [ ] Capital é derivado apenas de itens físicos não vendidos.
- [ ] Análises é uma rota separada e autenticada.

## STOP conditions

- Pare se os dados de backfill do plano 002 não conciliarem.
- Pare se a query agregada não tiver índice compatível; adicione índice por migration antes de liberar.

## Manutenção

Novos gráficos devem nascer em Análises, salvo se responderem a uma decisão diária imediata.
