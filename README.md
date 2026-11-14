# Bolachas da Zaira

Sistema web para apresentar os produtos da confeitaria e apoiar a administração de clientes, produtos e vendas. A aplicação oferece um catálogo público e um painel administrativo protegido por login.

## Funcionalidades

### Área pública

- Página inicial com apresentação da confeitaria.
- Catálogo público de produtos.
- Página com informações sobre a confeitaria.

### Painel administrativo

- Login e encerramento de sessão de administradores.
- Painel com indicadores de clientes, produtos, vendas, valor vendido e vendas recentes.
- Cadastro, consulta, edição e exclusão de clientes.
- Cadastro, consulta, edição e exclusão de produtos, com nome, valor, ingredientes, observações e foto opcional.
- Cadastro, consulta, edição e exclusão de vendas, com cliente, datas, local de entrega e itens com quantidades e valores unitários. O total é calculado a partir dos itens.
- Administração de usuários do sistema.

As fotos de produtos aceitam JPG, PNG e WEBP, com limite de 5 MB por arquivo. O catálogo é informativo; não há fluxo de compra ou pagamento online.

## Tecnologias

- **Node.js e Express** para o servidor e as rotas HTTP.
- **EJS e express-ejs-layouts** para as páginas renderizadas no servidor.
- **MySQL, Sequelize, mysql2 e Sequelize CLI** para persistência e migrações.
- **express-session** para sessões; **Argon2** e **bcryptjs** para hashes de senha.
- **Multer e Sharp** para receber, validar e processar imagens de produtos.
- **Bootstrap e Google Fonts**, carregados pela interface, além de estilos próprios.
- **Node.js Test Runner (`node:test`)** para os testes automatizados.

## Requisitos

- Node.js e npm.
- MySQL.

## Instalação e execução

1. Clone o repositório e entre na pasta do projeto.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie um banco de dados MySQL. Por exemplo:

   ```sql
   CREATE DATABASE bolachas_zaira
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

4. Crie um arquivo `.env` na raiz do projeto com as configurações do banco e da sessão:

   ```dotenv
   DB_HOST=localhost
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_NAME=bolachas_zaira
   SESSION_SECRET=substitua-por-uma-chave-aleatoria-com-pelo-menos-32-caracteres
   PORT=3000
   NODE_ENV=development
   ```

   `SESSION_SECRET` é obrigatório e deve ter pelo menos 32 caracteres. O `.env` contém credenciais e não deve ser compartilhado nem versionado.

5. Crie as tabelas aplicando as migrações:

   ```bash
   npm run db:migrate
   ```

6. Crie um administrador pelo terminal interativo. O comando solicitará o nome de usuário e a senha; ela deve ter de 12 a 128 bytes:

   ```bash
   npm run admin:create
   ```

7. Inicie o servidor:

   ```bash
   npm start
   ```

   A aplicação estará disponível em `http://localhost:3000`. Acesse `/login` para entrar no painel administrativo. Para desenvolvimento com reinicialização automática, use `npm run dev`.

Em produção, configure HTTPS. Defina `TRUST_PROXY=true` somente quando a aplicação estiver atrás de um proxy confiável que termina TLS.

## Testes

Execute a suíte automatizada com:

```bash
npm test
```

## Estrutura do projeto

- `src/app.js`: configuração do Express, middlewares e montagem das rotas.
- `src/routes/`: rotas públicas e administrativas.
- `src/controllers/`: lógica de requisição e resposta.
- `src/models/`: modelos Sequelize e relações entre entidades.
- `src/views/`: páginas e layouts EJS.
- `src/middlewares/`: autenticação, proteção CSRF, tratamento de erros e upload de imagens.
- `src/services/`: operações auxiliares, incluindo criação de administrador.
- `src/config/`: configurações de conexão com o banco.
- `migrations/`: criação e alteração do esquema do banco de dados.
- `public/`: arquivos estáticos e imagens enviadas para o catálogo.
- `test/`: testes automatizados.

## Contribuição

Contribuições com correções e melhorias são bem-vindas. Abra uma issue ou envie um pull request.

## Licença

O `package.json` declara a licença ISC.
