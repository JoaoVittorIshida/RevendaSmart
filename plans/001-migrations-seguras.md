# Plano 001: Automatizar migrations seguras e rastreáveis

> **Instruções ao executor:** execute cada passo e sua verificação antes de continuar. Não aplique qualquer migration no banco pessoal de produção sem um backup restaurado e validado. Ao finalizar, atualize a linha 001 em `plans/README.md`.
>
> **Drift check:** `git diff --stat 8f7144d..HEAD -- backend/package.json backend/db.js backend/server.js database_schema.sql README.md backend/migrations backend/scripts`

## Status

- **Prioridade:** P1
- **Esforço:** M
- **Risco:** ALTO — alterações de schema podem causar perda de dados se o protocolo for ignorado.
- **Depende de:** nenhum
- **Categoria:** migration/dx
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Por que isto importa

O banco atualmente é alterado manualmente e `database_schema.sql` é um dump destrutivo, com `DROP TABLE`. O sistema já possui dados reais, portanto novas funcionalidades não podem depender de recriar a base. Este plano cria um único caminho incremental, automatizado e auditável para schema e backfills, sem introduzir ORM.

## Estado atual

- `database_schema.sql:1-151` é o dump exportado em 2026-07-12; define `usuarios`, cadastros, `produtos` e `estoque`, mas contém `DROP TABLE`.
- `backend/package.json` só possui `start` e `dev`; não há `db:migrate` nem testes.
- `backend/db.js:1-28` já expõe um pool `mysql2` promise-based usando variáveis `DB_*`.
- `backend/server.js:35-44` registra as rotas; o servidor é CommonJS e deve permanecer assim.

## Comandos

| Finalidade | Comando | Sucesso esperado |
|---|---|---|
| Dependências do backend | `npm --prefix backend ci` | saída 0 |
| Aplicar migrations | `npm --prefix backend run db:migrate` | saída 0 e lista de migrations aplicadas/ignoradas |
| Simular | `npm --prefix backend run db:migrate -- --dry-run` | saída 0, sem DDL/DML executado |
| Testes do runner | `npm --prefix backend test` | saída 0 |
| Lint geral | `npm run lint` | atualmente falha; registrar apenas regressões novas, não bloquear este plano |

## Escopo

**Em escopo:** `backend/package.json`, `backend/scripts/migrate.js`, `backend/migrations/`, testes do runner, documentação de deploy em `README.md`, e comentários de cabeçalho em `database_schema.sql`.

**Fora do escopo:** qualquer tabela de produto, venda, reserva ou assinatura; instalar ORM; alterar dados existentes; executar o dump contra produção.

## Passos

### 1. Separar o papel do dump e das migrations

Documente no topo de `database_schema.sql` que ele é o **baseline de 2026-07-12 para banco vazio** e nunca deve ser executado sobre banco existente. Atualize o README: banco novo = importar baseline uma vez e executar `db:migrate`; banco existente = somente `db:migrate`.

**Verifique:** `rg -n "DROP TABLE|baseline|db:migrate" database_schema.sql README.md` mostra o aviso e o fluxo novo.

### 2. Criar runner versionado em SQL

Crie `backend/migrations/` com arquivos nomeados em ordem lexicográfica, por exemplo `20260712_001_<descricao>.sql`. Crie `backend/scripts/migrate.js` que:

1. usa `backend/db.js` e cria `schema_migrations` se ela não existir (`id`, `filename` único, `checksum`, `applied_at`);
2. obtém uma trava MySQL por advisory lock antes de ler/aplicar arquivos e a libera em `finally`;
3. lê somente arquivos `.sql` ordenados, calcula checksum, e executa cada arquivo ainda não registrado;
4. executa cada arquivo dentro de transação quando ele contiver DDL/DML transacionável; registra a versão apenas após sucesso;
5. falha se um arquivo já aplicado tiver checksum diferente;
6. aceita `--dry-run`, que lista pendências sem alterar a base;
7. fecha a conexão/pool e retorna código diferente de zero em qualquer falha.

Não construa SQL a partir de dados externos. O SQL das migrations é versionado no repositório e o runner só recebe opções fixas de linha de comando.

**Verifique:** em um banco de desenvolvimento descartável, rode duas vezes `npm --prefix backend run db:migrate`; a primeira cria `schema_migrations`, a segunda informa que não há pendências. Rode `--dry-run` e confirme por consulta que a tabela não ganhou linhas.

### 3. Integrar ao ciclo de deploy sem executar duas vezes em paralelo

Adicione os scripts `db:migrate`, `db:migrate:dry-run` e `test` ao `backend/package.json`. Configure o comando de inicialização/deploy para chamar `db:migrate` antes de `node server.js`; o advisory lock e a tabela de versões devem tornar múltiplas réplicas seguras. Se a plataforma de deploy oferecer uma etapa única de release, prefira essa etapa; se não oferecer, o `start` encadeado é aceito.

Falha de migration deve impedir o servidor de subir. Não ignore erros para “manter a API online” com schema incompatível.

**Verifique:** com `--dry-run` e em banco de desenvolvimento, confirme que o comando de start não inicia a API se uma migration intencionalmente inválida falhar; remova a migration de teste antes de concluir.

### 4. Estabelecer protocolo obrigatório de proteção

Documente no README um roteiro de produção: modo manutenção/backup, `mysqldump` usando variáveis de ambiente (sem escrever segredos), restauração em banco isolado, `db:migrate` nesse clone, consultas de contagem, e só então `db:migrate` em produção. Exija que cada migration futura tenha bloco de pré-checagem, contagens antes/depois e rollback documentado; migrations aplicadas não devem ser editadas.

**Verifique:** `rg -n "backup|restaura|rollback|não.*edite|produção" README.md` encontra o protocolo.

## Testes

- Crie testes Node (`node:test`) para ordenar arquivos, ignorar não-SQL, dry-run, checksum alterado e erro que não cria registro em `schema_migrations`.
- Use um banco `TEST_DB_*` descartável para o teste de integração; pule explicitamente esse caso quando as variáveis não existirem, mas mantenha os testes puros executáveis.

## Critérios de pronto

- [ ] `npm --prefix backend run db:migrate -- --dry-run` sai com código 0.
- [ ] Execução repetida não reaplica migration alguma.
- [ ] Alterar uma migration aplicada produz falha segura.
- [ ] `database_schema.sql` não é usado pelo runner e está documentado como destrutivo para base existente.
- [ ] `npm --prefix backend test` sai com código 0.

## STOP conditions

- Pare se não for possível restaurar um backup em uma base isolada.
- Pare se a base real possuir tabelas/colunas diferentes do dump de 2026-07-12; registre o diff e crie uma migration de compatibilidade, nunca “corrija” apagando tabelas.
- Pare se o provedor bloquear advisory locks ou DDL transacional; documente a limitação e escolha um mecanismo de lock compatível antes de automatizar o start.

## Manutenção

Todas as mudanças futuras de banco devem ser novos arquivos em `backend/migrations/`. O dump continua apenas como baseline; não o reexporte substituindo o baseline, pois um banco vazio deve poder aplicar a sequência completa de migrations sem colisões.
