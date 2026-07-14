# Plano 006: Criar Vitrine de anúncios sem publicar fora do sistema

> **Drift check:** `git diff --stat 8f7144d..HEAD -- src/App.jsx src/pages src/components src/contexts backend/routes backend/controllers backend/migrations`

## Status

- **Prioridade:** P2
- **Esforço:** L
- **Risco:** MÉDIO
- **Depende de:** `plans/003-venda-com-taxas-opcionais.md`, `plans/004-reservas-e-estoque-parado.md`
- **Categoria:** direction
- **Planejado em:** commit `8f7144d`, 2026-07-12

## Contexto e escopo

O sistema já tem foto, nome, marca e tipo de produto, e controla disponibilidade por unidade. A Vitrine transforma essas informações em material de anúncio para WhatsApp/Instagram sem tornar o produto um marketplace.

**Em escopo:** rota “Vitrine”, seleção de itens disponíveis, preço de anúncio e texto adicional, prévia, PNG quadrado e texto copiável. **Fora do escopo:** página pública, pagamento, publicação automática, integrações com marketplace, dados de compradores e rastreamento de leads.

## Passos

### 1. Modelar anúncio associado ao item físico

Crie migration para `anuncios`: UUID, usuário, `estoque_id`, preço anunciado, texto adicional curto, ativo, timestamps. Use uma regra no backend: só pode criar/ativar anúncio para item disponível; reserva, venda ou exclusão desativa o anúncio. Um item pode ter um anúncio ativo, com histórico preservado ao desativar.

**Verifique:** tentativa de criar anúncio para item reservado/vendido retorna erro; venda posterior desativa o anúncio automaticamente na mesma transação ou por regra transacional clara.

### 2. Construir a tela Vitrine

Adicione rota e item de navegação. A seleção deve partir de itens físicos disponíveis, agrupando visualmente produtos iguais apenas quando não esconder a unidade. Para cada anúncio, permitir preço e detalhes adicionais; preencher automaticamente foto, nome, marca, tipo e categoria. Mostre badges Disponível/Reservado/Vendido e impeça editar anúncio inativo como se estivesse disponível.

**Verifique:** item em estoque aparece; reservado e vendido não podem ser selecionados; layout funciona em mobile.

### 3. Gerar formatos de compartilhamento

Implemente primeiro um card **1080×1080 PNG** e botão de cópia de texto. O card deve ter foto, nome, tipo, preço e marca visual RevendaSmart discreta; detalhes adicionais só entram se couberem sem poluir. O texto deve usar o mesmo conteúdo em formato simples para colar no WhatsApp. Gere no cliente com canvas/SVG ou biblioteca pequena, sem enviar imagem para servidor.

**Verifique:** gerar card com e sem foto resulta em PNG legível; copiar texto funciona; não há requisição externa para criar a imagem.

## Testes

- API: criação/ativação/desativação e isolamento por usuário.
- Regressão: reservar ou vender item desativa anúncio ativo.
- UI: estados sem foto, sem itens e anúncio inativo.

## Critérios de pronto

- [ ] Vitrine nunca mostra item vendido como disponível.
- [ ] Primeiro formato entregue é quadrado e legível em celular.
- [ ] Não há integração ou postagem automática em plataforma externa.
- [ ] Dados de comprador não são solicitados nem armazenados.

## STOP conditions

- Pare se a implementação de imagem exigir armazenar base64 grande no banco.
- Pare se não houver transação/ordem segura entre venda, reserva e desativação de anúncio.

## Manutenção

Uma página pública somente deve ser considerada após definir autenticação, URL estável, expiração e privacidade. Não adicione-a implicitamente.
