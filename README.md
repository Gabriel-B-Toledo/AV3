# ✈️ Aerocode

**Sistema web para gestão da produção de aeronaves.** Cadastro de aeronaves, peças, etapas de
montagem, testes e equipe - com login, controle de acesso por cargo e dados persistidos em banco.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 🚀 Como rodar

Dá pra subir o projeto de **duas formas**. A mais rápida é com **Docker** - um comando sobe banco,
API e front de uma vez. Se preferir não usar Docker, há o **passo a passo manual** logo abaixo.

Primeiro, clone o repositório:

```bash
git clone https://github.com/Gabriel-B-Toledo/AV3.git
cd AV3
```

> Funciona em Windows e Linux - os comandos são os mesmos nos dois.

### 🐳 Opção A - Docker (recomendado)

Único pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (no Linux,
Docker Engine + plugin Compose). Não precisa instalar Node nem MySQL.

```bash
cp .env.example .env          # Windows (PowerShell): Copy-Item .env.example .env
docker compose up -d --build
```

**Pronto.** O Compose sobe **banco + API + front**, aplica as migrations e popula o seed
automaticamente. A primeira execução demora um pouco (build das imagens); nas próximas é rápido.

- 🌐 Front: **http://localhost:3000**
- ❤️ Saúde da API: **http://localhost:4000/api/health**

Comandos úteis:

```bash
docker compose logs -f        # acompanha os logs
docker compose down           # para tudo (mantém o banco)
docker compose down -v        # para tudo e apaga o banco (reset completo)
```

### 🔧 Opção B - Manual (sem Docker)

Pré-requisitos:

- [Node.js 18+](https://nodejs.org) (testado no Node 24)
- [MySQL 8](https://dev.mysql.com/downloads/) instalado e em execução

**1. Banco de dados** — conecte no MySQL como `root` e rode o script abaixo. Ele cria o banco e o
usuário que a aplicação usa:

```sql
CREATE DATABASE IF NOT EXISTS aerocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS aerocode_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'aerocode'@'localhost' IDENTIFIED BY 'aerocode';
GRANT ALL PRIVILEGES ON aerocode.* TO 'aerocode'@'localhost';
GRANT ALL PRIVILEGES ON aerocode_shadow.* TO 'aerocode'@'localhost';
FLUSH PRIVILEGES;
```

**2. API (`api/`)**

```bash
cd api
cp .env.example .env          # Windows (PowerShell): Copy-Item .env.example .env
npm install
npm run migrate               # cria as tabelas
npm run seed                  # popula com dados de exemplo
npm run dev                   # sobe a API em http://localhost:4000
```

O `.env.example` já vem com as credenciais do passo 1 - se você não mudou nada no script, funciona direto.

**3. Front-end (`web/`)** — em **outro terminal**:

```bash
cd web
npm install
npm run dev                   # abre em http://localhost:3000
```

**Pronto.** Acesse **http://localhost:3000** e entre com um dos usuários abaixo. 🎉

---

## 🔑 Acessos de teste

A senha de todos é **`123456`**.

| Usuário     | Cargo           | O que pode fazer                                          |
| ----------- | --------------- | -------------------------------------------------------- |
| `admin`     | Administrador   | Tudo, incluindo cadastrar funcionários                   |
| `engineer`  | Engenheiro      | Aeronaves, peças, etapas, testes e relatórios            |
| `operator`  | Operador        | Atualizar status de peças/etapas e consultar dados       |

---

## 🛟 Problemas comuns

<details>
<summary><strong>A porta 3306 já está em uso / o banco não sobe</strong></summary>

Acontece quando você já tem um **MySQL local** ocupando a 3306 na mesma máquina do Docker. No `.env`,
mude só a porta do **host** - internamente o container continua na 3306:

```env
DB_PORT=3307
```

Depois rode `docker compose up -d` de novo. (No setup manual o problema não existe, porque a API
fala direto com o seu MySQL local.)
</details>

<details>
<summary><strong>As portas 3000 ou 4000 já estão ocupadas</strong></summary>

Ajuste no `.env` antes de subir o Docker:

```env
API_PORT=4001
WEB_PORT=3001
```

No setup manual, pare o processo que está usando a porta ou rode a API com outra (`PORT=4001` no `api/.env`).
</details>

<details>
<summary><strong>Mudei o código e o Docker não atualizou</strong></summary>

As imagens são construídas uma vez. Para reconstruir com o código novo:

```bash
docker compose up -d --build
```
</details>

<details>
<summary><strong>Quero zerar o banco e começar do zero</strong></summary>

```bash
docker compose down -v        # apaga o volume do banco
docker compose up -d --build  # recria, migra e popula o seed de novo
```
</details>

<details>
<summary><strong>(Manual) `npm run migrate` reclama do shadow database</strong></summary>

O Prisma usa o banco `aerocode_shadow` durante o `migrate dev`. Confirme que você criou esse banco
e deu o `GRANT` para o usuário `aerocode` no **passo 1**.
</details>

---

## 🧱 Arquitetura

```mermaid
flowchart LR
    U([Navegador]) --> W["web/ - Next.js + React<br/>porta 3000"]
    W -- "HTTP / REST (JSON)" --> A["api/ - Express + Prisma<br/>porta 4000"]
    A -- "SQL" --> DB[("MySQL<br/>porta 3306")]
```

- **`web/`** - interface em Next.js / React. Telas de login, aeronaves, peças e funcionários.
- **`api/`** - API REST em Express + TypeScript. Autenticação por **JWT**, autorização por cargo,
  regras de negócio nos *services* e acesso ao banco via **Prisma ORM**.

```
AV3/
├── api/                # back-end (Express + Prisma)
│   ├── prisma/         # schema, migrations e seed
│   └── src/            # rotas, services e middlewares
├── web/                # front-end (Next.js + React)
├── docs/               # enunciados e relatórios
├── docker-compose.yml  # sobe banco + API + front
└── .env.example        # variáveis usadas pelo Compose
```

---

## 🔌 API

A API roda em `http://localhost:4000`. Para conferir se está no ar: `GET /api/health`.
Toda rota (exceto o login) espera o header `Authorization: Bearer <token>`.

<details>
<summary><strong>Ver principais endpoints</strong></summary>

| Método  | Rota                               | Descrição                          |
| ------- | ---------------------------------- | ---------------------------------- |
| `POST`  | `/api/auth/login`                  | Autentica e retorna o token JWT    |
| `GET`   | `/api/aeronaves`                   | Lista as aeronaves                 |
| `POST`  | `/api/aeronaves`                   | Cadastra uma aeronave              |
| `POST`  | `/api/aeronaves/:codigo/pecas`     | Vincula uma peça à aeronave        |
| `POST`  | `/api/aeronaves/:codigo/etapas`    | Cria uma etapa de montagem         |
| `POST`  | `/api/aeronaves/:codigo/testes`    | Registra um teste                  |
| `POST`  | `/api/aeronaves/:codigo/relatorio` | Gera o relatório de entrega        |
| `PATCH` | `/api/etapas/:id/status`           | Inicia, finaliza ou reabre a etapa |
| `POST`  | `/api/etapas/:id/responsaveis`     | Associa um responsável à etapa     |
| `GET`   | `/api/pecas` · `/api/funcionarios` | Catálogo de peças e equipe         |

</details>

> Cada resposta inclui o header `Server-Timing` com o tempo de processamento, usado na análise
> de desempenho do projeto.

---

## 📄 Documentação

Os enunciados de cada etapa e o relatório do projeto estão em [`docs/`](docs/).
