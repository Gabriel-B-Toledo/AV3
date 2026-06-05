import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { renderBarChart } from "./charts";

const BASE = process.env.BENCH_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const USUARIO = process.env.BENCH_USER ?? "admin";
const SENHA = process.env.BENCH_PASS ?? "123456";
const ENDPOINT = process.env.BENCH_ENDPOINT ?? "/api/aeronaves";
const NIVEIS = (process.env.BENCH_LEVELS ?? "1,5,10").split(",").map((s) => Number(s.trim()));
const REQUISICOES_POR_USUARIO = Number(process.env.BENCH_REQUESTS ?? 30);
const AQUECIMENTO = Number(process.env.BENCH_WARMUP ?? 5);

const SAIDA = path.resolve(__dirname, "..", "..", "docs", "relatorio-qualidade");

interface Medicao {
  resposta: number;
  processamento: number;
  latencia: number;
}

interface Estatistica {
  media: number;
  p50: number;
  p95: number;
}

interface ResumoNivel {
  usuarios: number;
  amostras: number;
  latencia: Estatistica;
  processamento: Estatistica;
  resposta: Estatistica;
}

async function login(): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: USUARIO, senha: SENHA }),
    });
  } catch {
    throw new Error(`Não foi possível conectar à API em ${BASE}. Suba a API com "npm run dev" antes do benchmark.`);
  }
  if (!res.ok) {
    throw new Error(
      `Login falhou (HTTP ${res.status}). Confirme que o banco foi populado ("npm run seed") e que o usuário "${USUARIO}" existe.`,
    );
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

function lerProcessamento(res: Response): number {
  const direto = res.headers.get("x-processing-time-ms");
  if (direto) return Number(direto);
  const serverTiming = res.headers.get("server-timing");
  if (serverTiming) {
    const m = serverTiming.match(/dur=([\d.]+)/);
    if (m) return Number(m[1]);
  }
  return 0;
}

async function medirRequisicao(token: string): Promise<Medicao> {
  const inicio = performance.now();
  const res = await fetch(`${BASE}${ENDPOINT}`, { headers: { Authorization: `Bearer ${token}` } });
  await res.arrayBuffer();
  const fim = performance.now();
  if (!res.ok) throw new Error(`Requisição a ${ENDPOINT} falhou (HTTP ${res.status}).`);
  const resposta = fim - inicio;
  const processamento = lerProcessamento(res);
  const latencia = Math.max(0, resposta - processamento);
  return { resposta, processamento, latencia };
}

function estatistica(valores: number[]): Estatistica {
  const ordenado = [...valores].sort((a, b) => a - b);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const percentil = (p: number) => ordenado[Math.min(ordenado.length - 1, Math.floor((p / 100) * ordenado.length))];
  return { media, p50: percentil(50), p95: percentil(95) };
}

async function rodarNivel(token: string, usuarios: number): Promise<ResumoNivel> {
  await Promise.all(
    Array.from({ length: usuarios }, async () => {
      for (let i = 0; i < AQUECIMENTO; i++) await medirRequisicao(token);
    }),
  );

  const trabalhador = async (): Promise<Medicao[]> => {
    const out: Medicao[] = [];
    for (let i = 0; i < REQUISICOES_POR_USUARIO; i++) out.push(await medirRequisicao(token));
    return out;
  };

  const medicoes = (await Promise.all(Array.from({ length: usuarios }, () => trabalhador()))).flat();

  return {
    usuarios,
    amostras: medicoes.length,
    latencia: estatistica(medicoes.map((m) => m.latencia)),
    processamento: estatistica(medicoes.map((m) => m.processamento)),
    resposta: estatistica(medicoes.map((m) => m.resposta)),
  };
}

function tabelaMarkdown(resumos: ResumoNivel[]): string {
  const linhas = [
    "| Usuários | Amostras | Latência (média / p95) | Processamento (média / p95) | Resposta (média / p95) |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const r of resumos) {
    linhas.push(
      `| ${r.usuarios} | ${r.amostras} | ${r.latencia.media.toFixed(2)} / ${r.latencia.p95.toFixed(2)} ms | ` +
        `${r.processamento.media.toFixed(2)} / ${r.processamento.p95.toFixed(2)} ms | ` +
        `${r.resposta.media.toFixed(2)} / ${r.resposta.p95.toFixed(2)} ms |`,
    );
  }
  return linhas.join("\n");
}

function gerarRelatorio(resumos: ResumoNivel[]): string {
  const data = new Date().toLocaleString("pt-BR");
  return `# Relatório de Qualidade — Aerocode

> Gerado automaticamente por \`npm run bench\` em ${data}.

Este relatório apresenta a análise de desempenho da aplicação web Aerocode, conforme
exigido na AV3. São medidas três métricas — **latência**, **tempo de processamento** e
**tempo de resposta** — sob carga escalada de **1, 5 e 10 usuários simultâneos**. A
unidade de todas as medições é o **milissegundo (ms)**.

## Como as métricas foram obtidas

O benchmark (\`api/bench/run.ts\`) atua como cliente HTTP e dispara requisições reais
contra a API (\`${ENDPOINT}\`), autenticado via JWT. Para cada requisição:

- **Tempo de resposta** — medido no cliente com \`performance.now()\` imediatamente antes
  do \`fetch\` e logo após o corpo da resposta ser totalmente recebido. É o tempo total
  percebido pelo usuário.
- **Tempo de processamento** — medido no servidor pelo middleware \`metrics\`
  (\`api/src/middleware/metrics.ts\`), que cronometra o handler com
  \`process.hrtime.bigint()\` e expõe o valor nos headers \`X-Processing-Time-Ms\` e
  \`Server-Timing\`. O cliente apenas lê esse header.
- **Latência** — calculada como \`tempo de resposta − tempo de processamento\`,
  representando o tempo gasto no trajeto de rede (ida e volta), conforme a Figura 1 do
  enunciado.

A carga de N usuários é simulada com **N trabalhadores concorrentes** (\`Promise.all\`),
cada um executando ${REQUISICOES_POR_USUARIO} requisições em sequência, após uma fase de
aquecimento de ${AQUECIMENTO} requisições por usuário (descartada). Os gráficos usam a
**média** de cada métrica; a tabela traz também o percentil 95 (p95).

## Resultados

${tabelaMarkdown(resumos)}

### Latência

![Latência por número de usuários](latencia.png)

### Tempo de processamento

![Tempo de processamento por número de usuários](processamento.png)

### Tempo de resposta

![Tempo de resposta por número de usuários](resposta.png)

## Observações

- Cliente e servidor executados na mesma máquina tendem a apresentar **latência de rede
  muito baixa**, já que não há trânsito por roteadores externos; o tempo de resposta é
  dominado pelo processamento. Para observar latências maiores, execute o benchmark com
  \`BENCH_BASE_URL\` apontando para a API hospedada em outra máquina/rede.
- Parâmetros configuráveis por variáveis de ambiente: \`BENCH_BASE_URL\`, \`BENCH_USER\`,
  \`BENCH_PASS\`, \`BENCH_ENDPOINT\`, \`BENCH_LEVELS\`, \`BENCH_REQUESTS\`, \`BENCH_WARMUP\`.
`;
}

async function main() {
  console.log(`Benchmark Aerocode → ${BASE}${ENDPOINT}`);
  const token = await login();

  const resumos: ResumoNivel[] = [];
  for (const usuarios of NIVEIS) {
    process.stdout.write(`  Medindo com ${usuarios} usuário(s)… `);
    const resumo = await rodarNivel(token, usuarios);
    resumos.push(resumo);
    console.log(
      `resposta ${resumo.resposta.media.toFixed(2)}ms · proc ${resumo.processamento.media.toFixed(2)}ms · lat ${resumo.latencia.media.toFixed(2)}ms`,
    );
  }

  fs.mkdirSync(SAIDA, { recursive: true });
  const categorias = NIVEIS.map((n) => `${n} usuário${n > 1 ? "s" : ""}`);

  renderBarChart({
    titulo: "Latência por número de usuários simultâneos",
    categorias,
    valores: resumos.map((r) => r.latencia.media),
    unidade: "ms",
    cor: "#2f7df6",
    arquivo: path.join(SAIDA, "latencia.png"),
  });
  renderBarChart({
    titulo: "Tempo de processamento por número de usuários simultâneos",
    categorias,
    valores: resumos.map((r) => r.processamento.media),
    unidade: "ms",
    cor: "#16a36b",
    arquivo: path.join(SAIDA, "processamento.png"),
  });
  renderBarChart({
    titulo: "Tempo de resposta por número de usuários simultâneos",
    categorias,
    valores: resumos.map((r) => r.resposta.media),
    unidade: "ms",
    cor: "#e0843c",
    arquivo: path.join(SAIDA, "resposta.png"),
  });

  fs.writeFileSync(path.join(SAIDA, "RELATORIO.md"), gerarRelatorio(resumos), "utf-8");

  console.log(`\n✔ Relatório e gráficos gerados em ${SAIDA}`);
}

main().catch((e) => {
  console.error(`\n✖ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
