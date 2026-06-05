import { TipoPeca, StatusPeca } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../http";
import { mapPeca } from "../mappers";

export interface DadosPeca {
  id: string;
  nome: string;
  tipo: TipoPeca;
  fornecedor: string;
  status?: StatusPeca;
}

export async function listar() {
  const pecas = await prisma.peca.findMany({ orderBy: { id: "asc" } });
  return pecas.map(mapPeca);
}

export async function criar(dados: DadosPeca) {
  const existente = await prisma.peca.findUnique({ where: { id: dados.id } });
  if (existente) throw new AppError(409, `Já existe uma peça com o código "${dados.id}".`);
  const peca = await prisma.peca.create({ data: dados });
  return mapPeca(peca);
}

// Regra AV1: acompanhar a evolução do status da peça até a utilização.
export async function atualizarStatus(id: string, status: StatusPeca) {
  const peca = await prisma.peca.findUnique({ where: { id } });
  if (!peca) throw new AppError(404, `Peça "${id}" não encontrada.`);
  const atualizada = await prisma.peca.update({ where: { id }, data: { status } });
  return mapPeca(atualizada);
}

export async function remover(id: string) {
  const peca = await prisma.peca.findUnique({ where: { id } });
  if (!peca) throw new AppError(404, `Peça "${id}" não encontrada.`);
  await prisma.peca.delete({ where: { id } });
}
