# Acesso administrativo

O painel administrativo usa o mesmo login do RevendaSmart e fica disponível em `/admin`. Contas administrativas são isoladas do fluxo normal do aplicativo, e todas as APIs em `/api/admin` revalidam a coluna `usuarios.admin` diretamente no banco.

## Promover uma conta

Depois de criar uma conta normalmente, promova-a manualmente e encerre qualquer sessão anterior:

```sql
UPDATE usuarios
SET admin = 1, token_version = token_version + 1
WHERE usuario = 'seu_usuario_admin';
```

No próximo login essa conta será direcionada exclusivamente ao painel. Não existe administrador ou senha padrão.

Para remover o acesso administrativo, faça a operação inversa e invalide novamente as sessões:

```sql
UPDATE usuarios
SET admin = 0, token_version = token_version + 1
WHERE usuario = 'seu_usuario_admin';
```

As alterações de banco necessárias são aplicadas pelo comando padrão:

```bash
npm --prefix backend run db:migrate
```
