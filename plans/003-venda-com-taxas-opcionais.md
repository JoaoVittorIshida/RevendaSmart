# Plano 003: Registrar venda líquida com detalhamento opcional

> **Drift check:** `git diff --stat 8f7144d..HEAD -- src/pages/Vendas.jsx src/contexts/DataContext.jsx backend/controllers/stockController.js backend/routes backend/migrations`

## Status

- **Prioridade:** P1
- **Esforço:** M
- **Risco:** MÉDIO
- **Depende de:** `plans/002-historico-imutavel-vendas.md`
- **Categoria:** direction
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Contexto e escopo

O fluxo atual recebe somente `precoVenda`, canal e data (`src/pages/Vendas.jsx:22-50`). A experiência precisa continuar rápida para venda local, mas permitir taxa e frete de marketplace sem criar financeiro geral.

**Em escopo:** `Vendas.jsx`, contexto, endpoint de venda, `vendas`, testes e cálculos que leem vendas. **Fora do escopo:** despesas fora da venda, descontos/parcelas, CRM, mudança de preço de estoque.

## Passos

### 1. Fixar contrato monetário

Use os campos de `vendas` do plano 002: `valor_bruto - taxa_plataforma - frete_vendedor = valor_liquido`. Valide no servidor que todos são valores decimais não negativos, que líquido não é negativo e que os IDs de item/canal pertencem ao usuário. O cliente nunca decide o líquido enviado: o backend o recalcula.

**Verifique:** teste de API tenta enviar líquido inconsistente e recebe resposta de validação; caso válido grava o líquido recalculado.

### 2. Preservar o modo rápido na tela de venda

Na etapa final, ofereça por padrão apenas **“Valor líquido recebido”**. Um botão discreto “Detalhar operação” revela “valor cobrado”, “taxa da plataforma” e “frete pago por você”, com o líquido exibido como leitura. Alternar para detalhado deve preencher o bruto com o líquido atual e custos zero; voltar ao modo rápido deve pedir confirmação se existirem custos para não descartá-los silenciosamente.

Use a máscara de moeda já existente em `src/utils/currency.js`. Todos os custos começam em `R$ 0,00` e são opcionais.

**Verifique:** venda local exige um único valor; venda detalhada mostra cálculo correto antes de confirmar; o valor exibido no toast/histórico é sempre líquido.

### 3. Atualizar histórico e relatórios existentes

Exiba no histórico valor líquido como “Recebido”. Mostre um detalhamento expansível apenas quando taxa ou frete forem maiores que zero. Dashboard e futuras análises somam `valor_liquido`, nunca valor bruto.

**Verifique:** uma venda de R$ 100,00 com R$ 10,00 de taxa e R$ 5,00 de frete aumenta receita em R$ 85,00 e lucro em R$ 85,00 menos custo.

## Testes

- Cálculo puro: modo rápido, taxa, frete, ambos, líquido zero e valores inválidos.
- API: recalcula líquido e não aceita item de outro usuário.
- UI: alternância dos dois modos não perde valores confirmados.

## Critérios de pronto

- [ ] Operação simples continua possível com um único valor.
- [ ] O servidor calcula e persiste o líquido.
- [ ] Taxa/frete não criam lançamentos financeiros independentes.
- [ ] Dashboard, histórico e exportação futura usam o líquido.

## STOP conditions

- Pare se o plano 002 não tiver entregue `vendas` como fonte de verdade.
- Pare se a máscara de moeda trabalhar com float em vez de centavos/decimal.

## Manutenção

Mantenha custos de venda limitados a taxa e frete. Qualquer pedido de despesa recorrente deve ser avaliado como novo produto, não encaixado neste formulário.
