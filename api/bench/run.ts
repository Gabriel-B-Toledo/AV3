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

const SAIDA = path.resolve(__dirname, "..", "..", "docs", "relatorio-performance");

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

  console.log(`\n✔ Gráficos atualizados em ${SAIDA}`);
  console.log("  Abra docs/relatorio-performance/RELATORIO-PERFORMANCE.md para a análise.");
}

main().catch((e) => {
  console.error(`\n✖ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
