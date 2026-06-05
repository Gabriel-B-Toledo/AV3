import { randomUUID } from "crypto";
import { StatusEtapa } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../http";

export type AcaoEtapa = "iniciar" | "finalizar" | "reabrir";

export async function criar(
  aeronaveCodigo: string,
  dados: { nome: string; prazo: string; descricao?: string },
) {
  const aeronave = await prisma.aeronave.findUnique({ where: { codigo: aeronaveCodigo } });
  if (!aeronave) throw new AppError(404, `Aeronave "${aeronaveCodigo}" não encontrada.`);

  const ordem = await prisma.etapa.count({ where: { aeronaveId: aeronaveCodigo } });

  await prisma.etapa.create({
    data: {
      id: `E-${randomUUID().slice(0, 6).toUpperCase()}`,
      nome: dados.nome,
      prazo: dados.prazo,
      descricao: dados.descricao ?? null,
      status: StatusEtapa.PENDENTE,
      ordem,
      aeronaveId: aeronaveCodigo,
    },
  });
}

export async function alterarStatus(etapaId: string, acao: AcaoEtapa) {
  const etapa = await prisma.etapa.findUnique({ where: { id: etapaId } });
  if (!etapa) throw new AppError(404, "Etapa não encontrada.");

  if (acao === "iniciar") {
    if (etapa.status !== StatusEtapa.PENDENTE) {
      throw new AppError(409, `A etapa "${etapa.nome}" não está pendente.`);
    }
    const emAndamento = await prisma.etapa.findFirst({
      where: { aeronaveId: etapa.aeronaveId, status: StatusEtapa.ANDAMENTO },
    });
    if (emAndamento) {
      throw new AppError(
        409,
        `A etapa "${emAndamento.nome}" já está em andamento. Conclua-a antes de iniciar outra.`,
      );
    }
    await prisma.etapa.update({ where: { id: etapaId }, data: { status: StatusEtapa.ANDAMENTO } });
    return;
  }

  if (acao === "finalizar") {
    if (etapa.status !== StatusEtapa.ANDAMENTO) {
      throw new AppError(409, `A etapa "${etapa.nome}" não está em andamento.`);
    }
    const anteriorPendente = await prisma.etapa.findFirst({
      where: {
        aeronaveId: etapa.aeronaveId,
        ordem: { lt: etapa.ordem },
        status: { not: StatusEtapa.CONCLUIDA },
      },
      orderBy: { ordem: "asc" },
    });
    if (anteriorPendente) {
      throw new AppError(
        409,
        `A etapa anterior "${anteriorPendente.nome}" ainda não foi concluída.`,
      );
    }
    await prisma.etapa.update({ where: { id: etapaId }, data: { status: StatusEtapa.CONCLUIDA } });
    return;
  }

  if (etapa.status !== StatusEtapa.CONCLUIDA) {
    throw new AppError(409, `A etapa "${etapa.nome}" não está concluída.`);
  }
  await prisma.etapa.update({ where: { id: etapaId }, data: { status: StatusEtapa.PENDENTE } });
}

export async function associarResponsavel(etapaId: string, funcionarioId: string) {
  const [etapa, funcionario] = await Promise.all([
    prisma.etapa.findUnique({ where: { id: etapaId } }),
    prisma.funcionario.findUnique({ where: { id: funcionarioId } }),
  ]);
  if (!etapa) throw new AppError(404, "Etapa não encontrada.");
  if (!funcionario) throw new AppError(404, "Funcionário não encontrado.");

  const jaAssociado = await prisma.etapaFuncionario.findUnique({
    where: { etapaId_funcionarioId: { etapaId, funcionarioId } },
  });
  if (jaAssociado) {
    throw new AppError(409, `${funcionario.nome} já está associado a esta etapa.`);
  }
  await prisma.etapaFuncionario.create({ data: { etapaId, funcionarioId } });
}

export async function removerResponsavel(etapaId: string, funcionarioId: string) {
  try {
    await prisma.etapaFuncionario.delete({
      where: { etapaId_funcionarioId: { etapaId, funcionarioId } },
    });
  } catch {
    throw new AppError(404, "Associação não encontrada.");
  }
}

export async function remover(etapaId: string) {
  const etapa = await prisma.etapa.findUnique({ where: { id: etapaId } });
  if (!etapa) throw new AppError(404, "Etapa não encontrada.");
  await prisma.etapa.delete({ where: { id: etapaId } });
}
