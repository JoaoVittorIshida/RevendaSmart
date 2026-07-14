# Plano 002: Criar histórico imutável de vendas e migrar os registros existentes

> **Instruções ao executor:** este plano trabalha com registros reais. Faça backup restaurável e execute primeiro em uma cópia do banco. Atualize o status 002 ao concluir.
>
> **Drift check:** `git diff --stat 8f7144d..HEAD -- backend/migrations backend/controllers/stockController.js backend/routes/stockRoutes.js backend/controllers/productsController.js database_schema.sql src/contexts/DataContext.jsx src/pages/HistoricoVendas.jsx`

## Status

- **Prioridade:** P1
- **Esforço:** L
- **Risco:** ALTO — backfill e histórico de receita.
- **Depende de:** `plans/001-migrations-seguras.md`
- **Categoria:** migration/direction
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Por que isto importa

Hoje uma venda existe apenas nos campos de `estoque`; o cancelamento redefine esses campos para `NULL` e o histórico desaparece. `backend/controllers/stockController.js:126-133`. Taxa/frete, análises e auditoria exigem uma venda preservada mesmo quando o item volta a ficar disponível.

## Estado atual

- `estoque` contém `preco_venda`, `canal_venda_id` e `data_venda`; seu status é `disponivel`, `vendido` ou `devolvido` (`database_schema.sql:81-102`).
- `sellItem` atualiza uma linha de estoque (`stockController.js:74-104`) e `cancelSale` apaga os dados comerciais.
- `DataContext.jsx` constrói `vendas` filtrando `itensEstoque` por `status === 'vendido'`.
- Produtos podem ser apagados por `productsController.js:57-73`; o FK atual pode apagar o estoque em cascata.

## Comandos

| Finalidade | Comando | Sucesso esperado |
|---|---|---|
| Backup antes de produção | `mysqldump` com variáveis de ambiente | arquivo restaurável, fora do repositório |
| Aplicar | `npm --prefix backend run db:migrate` | saída 0 |
| Testes backend | `npm --prefix backend test` | saída 0 |
| Consulta de conferência | consulta SQL descrita no passo 2 | contagens e somas conciliadas |

## Escopo

**Em escopo:** migrations para `vendas`, controllers/rotas de estoque, contexto e histórico de vendas, testes e documentação de migração.

**Fora do escopo:** UX de taxa/frete (plano 003), reservas, catálogo, clientes, parcelamento e exclusão física ampla de dados.

## Passos

### 1. Criar tabela de vendas preservável

Adicione migration aditiva para `vendas` com UUID, `usuario_id`, `estoque_id` indexado mas **sem FK em cascata**, snapshots de `produto_id`, nome do produto, categoria e canal, valores `valor_bruto`, `taxa_plataforma`, `frete_vendedor`, `valor_liquido`, `data_venda`, status `concluida`/`cancelada`, `cancelada_em`, timestamps e índices por usuário/data/status.

Todos os valores monetários devem ser `DECIMAL(10,2)`, não float. `valor_liquido` é o valor usado pelo dashboard. Use defaults zero para taxa/frete, para preservar sem inferência os dados antigos.

**Verifique:** `SHOW CREATE TABLE vendas` confirma índices, decimais e não há FK que possa apagar uma venda se produto/estoque for removido.

### 2. Backfill determinístico e verificável

Na mesma migration, insira uma venda `concluida` para cada item existente com `estoque.status = 'vendido'`. Copie o antigo `preco_venda` para bruto e líquido; taxa e frete recebem zero. Faça join somente para criar snapshots; se canal/produto já não existir, use rótulo explícito de histórico, não descarte a linha.

Antes de inserir, a migration deve falhar com relatório se houver item vendido sem preço ou sem data de venda. Não invente valores. Registre em arquivo de operação as consultas de antes/depois: quantidade de itens vendidos, quantidade de vendas concluídas, soma de `preco_venda` antigo e soma de `valor_liquido` novo, por usuário.

**Verifique:** as quatro medidas acima são idênticas no clone restaurado. Execute novamente `db:migrate` e confirme que não duplica vendas.

### 3. Trocar o backend para a fonte de verdade nova

Crie endpoint de histórico paginado que leia `vendas`, sempre filtrado por `usuario_id`; mantenha o formato que o frontend precisa durante a transição. Ao concluir venda, valide que o item pertence ao usuário e está disponível, então em uma única transação: atualize o estoque para vendido e insira a venda com snapshots. Ao cancelar, altere somente a venda para `cancelada`, preencha data de cancelamento e devolva o estoque para disponível; nunca apague os valores da venda.

Bloqueie exclusão de produto que tenha venda histórica, oferecendo arquivamento/ocultação em vez de remoção, ou preserve a venda via snapshots e impeça cascata destrutiva. Escolha uma única estratégia e teste-a; a opção recomendada é arquivar produto quando houver estoque ou vendas.

**Verifique:** venda, cancelamento e revenda posterior do mesmo item deixam duas vendas no histórico (a primeira cancelada, a segunda concluída), sem duplicar estoque.

### 4. Migrar frontend sem duplicar cálculos

Faça `DataContext` buscar histórico pelo endpoint de vendas, em vez de derivá-lo somente de `itensEstoque`. Atualize `HistoricoVendas` para apresentar vendas canceladas com filtro/status e não misturar canceladas aos totais padrão. Preserve a busca, ordenação e paginação existentes.

**Verifique:** uma venda cancelada fica visível como cancelada no histórico e não soma receita/lucro; itens disponíveis continuam aparecendo na tela de nova venda.

## Testes

- Backfill: item vendido normal, sem canal, produto/canal ausente, e linha inválida que deve interromper migration.
- API: venda de item disponível, tentativa de vender item não disponível, cancelamento, repetição de cancelamento e isolamento por `usuario_id`.
- Regressão: item vendido e posteriormente produto arquivado não perde a venda histórica.

## Critérios de pronto

- [ ] Backup foi restaurado e o backfill foi validado no clone.
- [ ] Contagem e soma de vendas antigas e novas conciliam por usuário.
- [ ] Cancelar venda não remove nenhum registro em `vendas`.
- [ ] Toda consulta de vendas filtra por `usuario_id` no servidor.
- [ ] Testes backend passam.

## STOP conditions

- Pare se existir venda antiga sem preço/data ou se somas não conciliarem; produza relatório de IDs afetados para decisão manual.
- Pare se o dump real divergir do baseline de modo que a migration não seja aditiva.
- Pare se preservar histórico exigir apagar/reescrever dados existentes.

## Manutenção

`vendas` é a fonte de verdade comercial; `estoque` representa disponibilidade física. Funcionalidades futuras devem consultar vendas para lucro e estoque para capital imobilizado.
