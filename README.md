# 🚀 Revenda Smart

Bem-vindo(a) ao **Revenda Smart**! 🎉

Este é um sistema de controle de vendas e estoque criado especialmente para **pequenos empreendedores, revendedores e importadores**. Se você compra produtos para revender e precisa de um lugar simples e bonito para organizar tudo, você está no lugar certo!

Nosso objetivo é tirar você das planilhas complicadas e oferecer uma ferramenta visual, rápida e fácil de usar.

---

## ✨ O que você pode fazer com o Revenda Smart?

### 📊 Acompanhar seus Resultados (Dashboard)
Veja de forma clara como está o seu negócio:
- **Resumo rápido:** Quanto você faturou, qual foi o seu lucro real e quantos itens vendeu.
- **Gráficos fáceis de entender:** Acompanhe a evolução das suas vendas nos últimos 30 dias e saiba de onde vêm seus clientes (Instagram, loja física, etc.).

### 📦 Organizar seu Estoque
- Cadastre lotes de produtos de forma super rápida.
- O sistema calcula automaticamente o custo unitário de cada item pra você.
- Saiba exatamente o que você tem guardado, separado por origem (nacional ou importado).

### � Registrar Vendas sem Complicação
- Um passo a passo super intuitivo: escolha o produto, selecione a unidade exata que está sendo vendida e confirme o valor.
- O sistema já calcula o seu lucro na hora!

### � Consultar o Histórico
- Uma lista completa de tudo que já foi vendido, com filtros práticos. Busque pelo nome do produto, data ou valor.

### 🎨 Trabalhar com Conforto (Modo Escuro)
- Gosta de trabalhar à noite ou prefere telas mais escuras? O Revenda Smart possui um **Dark Mode** (Modo Escuro) lindo e confortável para os olhos, que se adapta à sua preferência.

---

## 💻 Para os Desenvolvedores (Como rodar o projeto)

Se você é desenvolvedor e quer testar ou contribuir com o projeto, a arquitetura é dividida em **Frontend (React)** e **Backend (Node.js)**. 

### O que usamos (Tech Stack)
- **Visual:** React 19, Vite, Tailwind CSS v4, gráficos com Recharts e ícones do Lucide React.
- **Motor (API):** Node.js com Express, banco de dados MySQL (via `mysql2`), segurança com JWT e Bcrypt.

### Como rodar na sua máquina

**1. Baixe o projeto**
```bash
git clone https://github.com/SEU_USUARIO/revenda-smart.git
cd revenda-smart
```

**2. Prepare o Banco de Dados**
Você vai precisar do MySQL instalado. Basta rodar o arquivo `database_schema.sql` (que está na raiz do projeto) no seu gerenciador de banco de dados preferido para criar as tabelas.

**3. Configure a API (Backend)**
Abra o terminal, entre na pasta do backend e instale as dependências:
```bash
cd backend
npm install
```
Crie um arquivo chamado `.env` na pasta `backend` e preencha com seus dados do banco (use o `.env.example` como base, se houver, ou cole o texto abaixo):
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=revenda_smart_db
JWT_SECRET=uma_chave_secreta_sua
```

**4. Configure o Visual (Frontend)**
Volte para a pasta principal do projeto e instale as dependências:
```bash
# Na pasta raiz (revenda-smart)
npm install
```

**5. Tudo pronto! Hora de rodar 🚀**
Com um único comando na pasta raiz do projeto, você inicia tanto a API quanto a interface visual:
```bash
npm run dev
```
- Acesse o sistema pelo navegador em: `http://localhost:5173`

---

## 🤝 Quer ajudar a melhorar?

Achou um bug? Tem uma ideia genial para uma nova funcionalidade? 
Sinta-se à vontade para abrir uma **Issue** ou enviar um **Pull Request**. Toda ajuda é super bem-vinda!

---

💡 *Feito com ❤️ para descomplicar a vida de quem faz o próprio negócio acontecer.*
