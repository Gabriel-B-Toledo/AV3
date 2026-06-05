import fs from "fs";
import path from "path";
import { ResultadoTeste } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../http";
import { aeronaveInclude } from "../mappers";

const TIPO_AERONAVE: Record<string, string> = { COMERCIAL: "Comercial", MILITAR: "Militar" };
const TIPO_PECA: Record<string, string> = { NACIONAL: "Nacional", IMPORTADA: "Importada" };
const STATUS_PECA: Record<string, string> = {
  EM_PRODUCAO: "Em produção",
  EM_TRANSPORTE: "Em transporte",
  PRONTA: "Pronta",
};
const STATUS_ETAPA: Record<string, string> = {
  PENDENTE: "Pendente",
  ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export async function gerar(codigo: string, nomeCliente: string, dataEntrega: string) {
  const a = await prisma.aeronave.findUnique({ where: { codigo }, include: aeronaveInclude });
  if (!a) throw new AppError(404, `Aeronave "${codigo}" não encontrada.`);

  const linhas: string[] = [];
  const sep = "=".repeat(54);
  const sepMin = "-".repeat(54);

  linhas.push(sep);
  linhas.push("           AEROCODE - RELATÓRIO DE ENTREGA");
  linhas.push(sep);
  linhas.push(`Data de emissão : ${new Date().toLocaleString("pt-BR")}`);
  linhas.push(`Data de entrega : ${dataEntrega || "—"}`);
  linhas.push(`Cliente         : ${nomeCliente || "—"}`);
  linhas.push(sepMin);

  linhas.push("AERONAVE");
  linhas.push(`  Código      : ${a.codigo}`);
  linhas.push(`  Modelo      : ${a.modelo}`);
  linhas.push(`  Tipo        : ${TIPO_AERONAVE[a.tipo] ?? a.tipo}`);
  linhas.push(`  Capacidade  : ${a.capacidade}`);
  linhas.push(`  Alcance     : ${a.alcance} km`);
  linhas.push(sepMin);

  linhas.push(`PEÇAS UTILIZADAS (${a.pecas.length})`);
  if (a.pecas.length === 0) {
    linhas.push("  Nenhuma peça registrada.");
  } else {
    a.pecas.forEach((ap, i) => {
      const p = ap.peca;
      linhas.push(
        `  ${i + 1}. ${p.nome} | ${TIPO_PECA[p.tipo] ?? p.tipo} | Fornecedor: ${p.fornecedor} | Status: ${STATUS_PECA[p.status] ?? p.status}`,
      );
    });
  }
  linhas.push(sepMin);

  const etapasOrdenadas = [...a.etapas].sort((x, y) => x.ordem - y.ordem);
  linhas.push(`ETAPAS REALIZADAS (${etapasOrdenadas.length})`);
  if (etapasOrdenadas.length === 0) {
    linhas.push("  Nenhuma etapa registrada.");
  } else {
    etapasOrdenadas.forEach((e, i) => {
      linhas.push(`  ${i + 1}. ${e.nome} | Prazo: ${e.prazo} | Status: ${STATUS_ETAPA[e.status] ?? e.status}`);
      if (e.responsaveis.length > 0) {
        const nomes = e.responsaveis.map((ef) => ef.funcionario.nome).join(", ");
        linhas.push(`     Responsáveis: ${nomes}`);
      }
    });
  }
  linhas.push(sepMin);

  linhas.push(`RESULTADOS DOS TESTES (${a.testes.length})`);
  if (a.testes.length === 0) {
    linhas.push("  Nenhum teste registrado.");
  } else {
    a.testes.forEach((t, i) => {
      linhas.push(`  ${i + 1}. ${t.tipo} : ${t.resultado}`);
    });
  }
  const aprovados = a.testes.filter((t) => t.resultado === ResultadoTeste.APROVADO).length;
  const reprovados = a.testes.length - aprovados;
  linhas.push(`  Aprovados: ${aprovados} | Reprovados: ${reprovados}`);
  linhas.push(sepMin);

  const apta =
    a.testes.length > 0 && reprovados === 0
      ? "SIM - APTA PARA ENTREGA"
      : reprovados > 0
        ? "NÃO - POSSUI TESTES REPROVADOS"
        : "PENDENTE - SEM TESTES REGISTRADOS";
  linhas.push(`SITUAÇÃO FINAL: ${apta}`);
  linhas.push(sep);

  const texto = linhas.join("\n");

  const dir = path.join(process.cwd(), "relatorios");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const nomeArquivo = `relatorio_${a.codigo}_${Date.now()}.txt`;
  fs.writeFileSync(path.join(dir, nomeArquivo), texto, "utf-8");

  return { texto, arquivo: nomeArquivo };
}
