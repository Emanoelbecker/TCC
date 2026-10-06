# User Management System

Este é um sistema de gerenciamento de usuários desenvolvido com Node.js, Express e MySQL. Ele permite a criação, leitura, atualização e exclusão (CRUD) de usuários, com uma interface web para administradores e usuários.

## Funcionalidades

- Cadastro e login de usuários
- Listagem de usuários
- Criação, edição e exclusão de usuários
- Diferenciação entre administradores e usuários comuns

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução para JavaScript no lado do servidor.
- **Express**: Framework para construção de aplicativos web com Node.js.
- **MySQL**: Sistema de gerenciamento de banco de dados relacional.
- **EJS**: Motor de visualização para renderizar páginas HTML.
- **Bootstrap**: Framework CSS para estilização das páginas.

## Instalação

### 1. Fork e Clone este Repositório

### 2. Instale as Dependências

Certifique-se de que você tem o Node.js e o MySQL instalados. Em seguida, execute o comando para instalar as dependências do projeto:

### 3. Configure o Banco de Dados

Crie um banco de dados no MySQL, por exemplo, user_management.

Crie um arquivo `.env` com base em `.env.example` e informe as credenciais do banco. Defina `SESSION_SECRET` com um valor aleatório de pelo menos 32 caracteres; o servidor não inicia sem esse segredo. Em produção, use HTTPS e configure `TRUST_PROXY=true` somente quando a aplicação estiver atrás de um proxy TLS confiável. O arquivo `.env` não deve ser versionado.

O seed de usuário de teste é opcional e não funciona em produção. Para habilitá-lo localmente, configure `SEED_TEST_USER=true`, `SEED_TEST_USERNAME` e `SEED_TEST_PASSWORD` no `.env`.

### 4. Execute o Aplicativo

Inicie o servidor com o comando:

npm start

O servidor estará disponível em http://localhost:3000.

## Estrutura MVC

O código da aplicação fica em `src/`:

- `app.js` configura o Express, carrega os módulos e inicia o servidor.
- `routes/` declara caminhos HTTP e encaminha cada requisição para um controller.
- `controllers/` coordena a requisição e a resposta, chamando models ou services.
- `models/` concentra o acesso e as operações sobre os dados.
- `views/` contém os templates EJS; não acessa diretamente o banco de dados.
- `middlewares/` contém funções compartilhadas de autenticação e tratamento de requisições.
- `services/` abriga operações de aplicação independentes do transporte HTTP, como o seed de usuário de teste.
- `config/` centraliza configurações de banco de dados e ambiente.

As migrations e arquivos de banco permanecem na raiz do projeto. Esta organização prepara as camadas sem adicionar novos CRUDs.

Contribuição

Sinta-se à vontade para contribuir com melhorias ou correções. Abra uma issue ou envie um pull request para colaborar com o projeto.
Licença

Este projeto é licenciado sob a MIT License.