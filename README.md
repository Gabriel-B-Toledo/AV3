# Aerocode ✈️

Sistema web para gerenciar a produção de aeronaves: cadastro de aeronaves, peças, etapas de montagem, testes e equipe responsável, com login e controle de acesso por cargo. Os dados ficam persistidos em banco.

Stack: Next.js 16 + React 19 no front, Express 4 + Prisma 6 na API (tudo em TypeScript) e MySQL 8 no banco. Pode rodar com Docker ou localmente, como preferir.

## Como rodar

Antes de qualquer coisa, clone o repositório:

```bash
git clone https://github.com/Gabriel-B-Toledo/AV3.git
cd AV3
```

Os comandos são iguais no Windows e no Linux. A partir daqui, escolha um dos dois caminhos abaixo — se tiver Docker, recomendo por ele, dá bem menos trabalho.

### Opção A — Docker

Só precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) (no Linux, Docker Engine com o plugin do Compose). Não é necessário ter Node nem MySQL na máquina.

```bash
cp .env.example .env          # no PowerShell: Copy-Item .env.example .env
docker compose up -d --build
```

Isso sobe banco, API e front de uma vez, roda as migrations e popula o seed. A primeira execução demora um pouco por causa do build das imagens; as seguintes são rápidas.

- Front: http://localhost:3000
- Health da API: http://localhost:4000/api/health

Comandos úteis:

```bash
docker compose logs -f        # acompanhar os logs
docker compose down           # parar tudo (o banco continua)
docker compose down -v        # parar tudo e apagar o banco
```

### Opção B — Manual

Pré-requisitos:

- [Node.js 18+](https://nodejs.org) (testei no 24)
- [MySQL 8](https://dev.mysql.com/downloads/) rodando

**1. Banco.** Conecte no MySQL como `root` e rode o script abaixo — ele cria os dois bancos e o usuário da aplicação:

```sql
CREATE DATABASE IF NOT EXISTS aerocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS aerocode_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'aerocode'@'localhost' IDENTIFIED BY 'aerocode';
GRANT ALL PRIVILEGES ON aerocode.* TO 'aerocode'@'localhost';
GRANT ALL PRIVILEGES ON aerocode_shadow.* TO 'aerocode'@'localhost';
FLUSH PRIVILEGES;
```

**2. API.** Dentro de `api/`:

```bash
cd api
cp .env.example .env          # no PowerShell: Copy-Item .env.example .env
npm install
npm run migrate               # cria as tabelas
npm run seed                  # popula com dados de exemplo
npm run dev                   # sobe a API em http://localhost:4000
```

O `.env.example` já vem com as credenciais do passo 1, então se você não alterou o script funciona direto.

**3. Front.** Em outro terminal, dentro de `web/`:

```bash
cd web
npm install
npm run dev                   # abre em http://localhost:3000
```

Feito isso, acesse http://localhost:3000 e entre com um dos usuários da próxima seção.

## Usuários de teste

A senha é `123456` pra todos.

| Usuário     | Cargo           | O que pode fazer                                          |
| ----------- | --------------- | -------------------------------------------------------- |
| `admin`     | Administrador   | Tudo, incluindo cadastrar funcionários                   |
| `engineer`  | Engenheiro      | Aeronaves, peças, etapas, testes e relatórios            |
| `operator`  | Operador        | Atualizar status de peças/etapas e consultar dados       |

## Se algo der errado

<details>
<summary>Alguma porta (3306, 3000 ou 4000) já está em uso</summary>

Ajuste as portas do host no `.env` antes de subir o Docker e rode `docker compose up -d` de novo:

```env
DB_PORT=3307
API_PORT=4001
WEB_PORT=3001
```

No modo manual, pare o processo que está usando a porta ou suba a API em outra (`PORT=4001` no `api/.env`).
</details>

<details>
<summary>Mudei o código e o Docker não pegou a alteração</summary>

As imagens são buildadas uma vez só. Para reconstruir com o código novo, rode `docker compose up -d --build`. Para zerar o banco junto, use `docker compose down -v` antes.
</details>

<details>
<summary>(Manual) o `npm run migrate` reclama do shadow database</summary>

O Prisma usa o banco `aerocode_shadow` durante o `migrate dev`. Confira se você criou esse banco e deu o `GRANT` para o usuário `aerocode` no passo 1.
</details>

## Como o projeto está organizado

```mermaid
flowchart LR
    U([Navegador]) --> W["web/ — Next.js + React<br/>porta 3000"]
    W -- "HTTP / REST (JSON)" --> A["api/ — Express + Prisma<br/>porta 4000"]
    A -- "SQL" --> DB[("MySQL<br/>porta 3306")]
```

O `web/` é a interface em Next.js/React — telas de login, aeronaves, peças e funcionários. O `api/` é a API REST em Express + TypeScript: a autenticação é por JWT, a autorização é por cargo, as regras de negócio ficam nos *services* e o acesso ao banco passa pelo Prisma.

```
AV3/
├── api/                # back-end (Express + Prisma)
│   ├── prisma/         # schema, migrations e seed
│   └── src/            # rotas, services e middlewares
├── web/                # front-end (Next.js + React)
├── docs/               # enunciados e relatórios
├── docker-compose.yml  # sobe banco + API + front em multi containers
└── .env.example        # variáveis usadas pelo Compose
```