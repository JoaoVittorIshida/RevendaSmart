# Planos de implementação — RevendaSmart

Gerado em 2026-07-12 a partir do commit `8f7144d`. Execute **um plano por vez**, na ordem abaixo. Cada executor deve ler o plano inteiro, executar as verificações e só então marcar o status correspondente.

## Regra de preservação de dados

O banco em uso já contém dados pessoais de produção. Nenhuma etapa pode executar `database_schema.sql` nesse banco: o arquivo é um dump de baseline e contém `DROP TABLE`. Para todo deploy que altere o schema: faça backup verificável, execute as migrations em cópia/restauração de teste, e somente então execute a mesma migration no banco de produção.

## Ordem e status

| Plano | Título | Prioridade | Esforço | Depende de | Status |
|---|---|---|---|---|---|
| 001 | Automatizar migrations seguras | P1 | M | — | DONE |
| 002 | Criar histórico imutável de vendas e migrar dados | P1 | L | 001 | DONE |
| 003 | Detalhar a operação de venda sem perder simplicidade | P1 | M | 002 | DONE |
| 004 | Reservas e inteligência de estoque parado | P1 | M | 002 | DONE |
| 005 | Separar dashboard operacional das análises | P2 | M | 003, 004 | DONE |
| 006 | Criar a Vitrine para anúncios compartilháveis | P2 | L | 003, 004 | DONE |
| 007 | Importar, exportar e fazer backup dos dados | P2 | M | 001 | DONE |
| 008 | Preparar trial e assinatura de plano único | P3 | L | 001, 007 | TODO |

## Dependências

- O plano 001 é obrigatório: ele cria o mecanismo usado para todas as alterações de banco seguintes.
- O plano 002 converte o conceito atual de venda (campos em `estoque`) em histórico preservado; planos 003–006 devem consumir esse histórico.
- O plano 005 depende dos números líquidos da venda e do estado `reservado`.
- A Vitrine não deve anunciar itens reservados ou vendidos, por isso depende do plano 004.
- O plano 008 só deve começar depois da portabilidade do plano 007; não integre pagamento enquanto não houver backup confiável.

## Decisões tomadas

- O produto continua simples: não incluir CRM, contas a receber, reposição automática, garantia ou financeiro geral.
- Taxa da plataforma e frete são custos **opcionais de uma venda**, não lançamentos financeiros independentes.
- A Vitrine começa com card de imagem e texto copiável; página pública e publicação automática em marketplaces ficam fora do escopo.
- Use um runner próprio com `mysql2`, e não um ORM. O backend já usa SQL manual; acrescentar Prisma/Sequelize agora traria uma migração de arquitetura sem retorno proporcional.

## Verificação atual conhecida

- O repositório não possui scripts de teste.
- `npm run lint` falha no estado atual, inclusive porque o ESLint aplica globais de navegador aos arquivos CommonJS do backend. Os planos usam testes direcionados como gate; uma correção ampla de lint permanece fora deste roadmap.

## Itens considerados e deliberadamente excluídos

- Cadastro de clientes, fiado, parcelas e fluxo de caixa completo: não condizem com revendas pessoais de hardware com compradores majoritariamente únicos.
- Controle de garantia, serial, acessórios e fotos por unidade: adiciona complexidade sem atender o caso dominante de itens novos em promoção.
- Alerta de reposição: promoções não obedecem a um ciclo previsível de compra.
