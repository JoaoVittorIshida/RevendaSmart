# Plano 007: Importar, exportar e restaurar dados sem lock-in

> **Drift check:** `git diff --stat 8f7144d..HEAD -- src/App.jsx src/pages backend/routes backend/controllers backend/migrations backend/package.json README.md`

## Status

- **Prioridade:** P2
- **Esforço:** M
- **Risco:** ALTO — importação pode introduzir duplicação ou dados inválidos.
- **Depende de:** `plans/001-migrations-seguras.md`
- **Categoria:** direction/dx
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Contexto e escopo

O público vem de planilhas e precisa confiar que pode levar seus dados embora. Comece com CSV e JSON: ambos abrem/geram no Excel e não exigem integrar uma suíte de planilhas.

**Em escopo:** exportação CSV, backup JSON por usuário, importação CSV de produtos e entrada em lote com prévia/validação, documentação. **Fora do escopo:** importação XLSX nativa, restauração automática em produção, merge de backups entre usuários e arquivos de imagem.

## Passos

### 1. Definir formatos versionados e não ambíguos

Documente cabeçalhos de CSV para produtos e entradas: nome, marca, categoria, tipo, quantidade, custo unitário, canal de compra e origem. Defina JSON de backup com `version`, exportado_em, produtos, cadastros auxiliares, estoque, vendas, reservas e anúncios quando existirem. Valores monetários devem ser strings decimais em JSON/CSV, nunca float.

**Verifique:** exemplos de CSV e JSON passam em parser sem depender de locale do navegador.

### 2. Implementar exportação e backup primeiro

Crie endpoint autenticado que monta backup exclusivamente do `usuario_id` da sessão e aplica cabeçalho de download. Adicione botões para exportar estoque/vendas em CSV e baixar backup JSON. Não inclua hashes de senha, tokens, chaves ou dados de outros usuários.

**Verifique:** backup de usuário A não contém UUID/nome de item de B; CSV abre no Excel com acentos e valores corretos.

### 3. Implementar importação em duas fases

A interface aceita CSV, faz validação e mostra prévia com linhas aceitas/rejeitadas antes de confirmar. No servidor, valide limites, monetários, IDs/canais do usuário e duplicação; confirme a importação em transação, sem criar parcialmente um lote. Gere relatório baixável de erros por linha. Não sobrescreva produtos existentes automaticamente; ofereça criação explícita ou pare em ambiguidade.

**Verifique:** CSV com uma linha inválida não muda banco antes da confirmação; confirmação de lote válido cria a quantidade esperada; repetir arquivo não duplica silenciosamente sem escolha explícita.

### 4. Documentar restauração segura

Backup JSON é para recuperação assistida: a restauração deve acontecer primeiro em banco de teste e exigir confirmação de conta/usuário. Não exponha “restaurar backup” na interface de produção nesta fase.

**Verifique:** README contém procedimento de teste de restauração e proíbe substituir dados de produção sem backup atual.

## Testes

- Serializer de backup, isolamento por usuário e ausência de segredo.
- Parser CSV: cabeçalho ausente, moeda inválida, quantidade acima do limite, UTF-8, duplicidade e transação integral.
- Exportação de venda cancelada com status correto.

## Critérios de pronto

- [ ] CSV e JSON são versionados/documentados.
- [ ] Exportação é tenant-safe.
- [ ] Importação só escreve após prévia e confirmação.
- [ ] Erro em uma importação não deixa escrita parcial.

## STOP conditions

- Pare se a importação precisar aceitar arquivo que não possa ser validado sem suposições.
- Pare se a restauração não puder ser testada em ambiente isolado.

## Manutenção

Ao adicionar tabela de domínio, atualize a versão do backup e mantenha leitores para versões anteriores ou escreva migration de backup explícita.
