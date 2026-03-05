# 🚀 Revenda Smart - Sistema de Controle de Vendas

O **Revenda Smart** é um sistema completo e intuitivo para controle de vendas, estoque e produtos, focado em pequenos empreendedores e revendedores. Ele oferece uma gestão eficiente de catálogo, entradas e saídas de estoque (canais de compra e venda), cálculo de lucro, e um design moderno.

---

## 📋 Funcionalidades Principais

- **📦 Gestão de Produtos**: Cadastro de produtos com nome, marca, categoria, tipo, cor (recém implementado para variação), preço sugerido, e fotos.
- **🔄 Controle de Estoque**: Gerenciamento de entradas e saídas (estoque unificado ou detalhado), controlando preço de custo, e status (disponível, vendido, devolvido).
- **🛍️ Canais de Venda e Compra**: Personalize as fontes de seus produtos e para onde/por onde estão sendo vendidos (ex: Loja Física, Instagram, Mercado Livre).
- **🔒 Autenticação e Segurança**: Sistema de login seguro com JWT e senhas criptografadas (Bcrypt), mantendo o isolamento de dados por usuário.
- **⌛ Histórico Preciso**: Registro exato do horário das vendas para ordenação perfeita e manutenção dos registros internos.
- **📊 Interface Amigável**: Dashboard interativo focado na melhor experiência de usuário.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi dividido em duas partes principais: Frontend e Backend.

### 💻 Frontend
- **React 19** com **Vite** para máxima performance.
- **React Router DOM** para navegação SPA (Single Page Application).
- **Lucide React** para ícones bonitos e consistentes.
- **CSS Modules / Tailwind** para estilização moderna e responsiva.

### ⚙️ Backend
- **Node.js** com **Express**.
- **MySQL (mysql2)** para o banco de dados relacional.
- **JWT (JSON Web Tokens)** para proteção e autenticação de rotas API.
- **Bcrypt** para hash de senhas.
- **UUID** para identificadores únicos e seguros.

---

## 🚀 Como Executar o Projeto

Siga as instruções abaixo para configurar e rodar o Revenda Smart na sua máquina local:

### 1️⃣ Pré-requisitos
- Node.js instalado (versão 18+ recomendada)
- MySQL Server rodando
- Git (opcional, para clonar)

### 2️⃣ Clonando o repositório
```bash
git clone https://github.com/SEU_USUARIO/revenda-smart.git
cd revenda-smart
```

### 3️⃣ Configurando o Banco de Dados
Abra o seu cliente MySQL (ex: MySQL Workbench, DBeaver ou terminal) e execute o script SQL que se encontra na raiz do projeto:
```bash
# Execute o arquivo database_schema.sql
```
Certifique-se de configurar as credenciais do banco corretamente no Backend.

### 4️⃣ Configurando o Backend (API)
Navegue até a pasta do backend, instale as dependências e crie um arquivo `.env`:
```bash
cd backend
npm install
```
Crie um arquivo `.env` na pasta `backend` baseado no `.env.example` e coloque suas variáveis:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=revenda_smart_db
JWT_SECRET=uma_chave_secreta_muito_forte
```

### 5️⃣ Configurando o Frontend
Abra um novo terminal na raiz do projeto (`cd revenda-smart`) e instale as dependências:
```bash
npm install
```

### 6️⃣ Iniciando o Sistema
Com o script que configuramos no pacote principal, você pode iniciar o Backend e o Frontend ao mesmo tempo!

Na raiz do projeto, execute:
```bash
npm run dev
```

* O **Frontend** iniciará na porta padrão do Vite (geralmente `http://localhost:5173`).
* O **Backend** iniciará na porta configurada (ex: `http://localhost:3000`).

---

## 🎨 Estrutura de Diretórios Básica

```text
/revenda-smart
├── /backend            # Código fonte da API em Node.js (Rotas, Controllers, Middleware)
├── /src                # Código fonte do Frontend em React (Componentes, Páginas, Contexto)
├── /public             # Arquivos públicos (favicon, etc)
├── database_schema.sql # Script para criação ds tabelas no banco de dados
├── package.json        # Arquivo de configuração de scripts para rodar tudo
└── README.md           # Você está aqui!
```

---

## 🤝 Contribuição
Se você deseja contribuir para o **Revenda Smart**, sinta-se livre para abrir uma **Issue** relatando bugs ou sugerindo novas funcionalidades. Pull Requests são muito bem-vindos!

---
*Feito com ❤️ para facilitar a vida do revendedor.*
