import { TipoAeronave, TipoTeste, ResultadoTeste } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../http";
import { aeronaveInclude, mapAeronave } from "../mappers";

export interface DadosAeronave {
  codigo: string;
  modelo: string;
  tipo: TipoAeronave;
  capacidade: number;
  alcance: number;
  descricao?: string;
}

async function garantirExiste(codigo: string) {
  const a = await prisma.aeronave.findUnique({ where: { codigo } });
  if (!a) throw new AppError(404, `Aeronave "${codigo}" não encontrada.`);
}

export async function listar() {
  const aeronaves = await prisma.aeronave.findMany({
    include: aeronaveInclude,
    orderBy: { codigo: "asc" },
  });
  return aeronaves.map(mapAeronave);
}

export async function obter(codigo: string) {
  const a = await prisma.aeronave.findUnique({ where: { codigo }, include: aeronaveInclude });
  if (!a) throw new AppError(404, `Aeronave "${codigo}" não encontrada.`);
  return mapAeronave(a);
}

export async function criar(dados: DadosAeronave) {
  const existente = await prisma.aeronave.findUnique({ where: { codigo: dados.codigo } });
  if (existente) {
    throw new AppError(409, `Já existe uma aeronave com o código "${dados.codigo}".`);
  }
  await prisma.aeronave.create({ data: dados });
  return obter(dados.codigo);
}

export async function atualizar(
  codigo: string,
  dados: Partial<Omit<DadosAeronave, "codigo">>,
) {
  await garantirExiste(codigo);
  await prisma.aeronave.update({ where: { codigo }, data: dados });
  return obter(codigo);
}

export async function remover(codigo: string) {
  await garantirExiste(codigo);
  await prisma.aeronave.delete({ where: { codigo } });
}

export async function vincularPeca(codigo: string, pecaId: string) {
  await garantirExiste(codigo);
  const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
  if (!peca) throw new AppError(404, `Peça "${pecaId}" não encontrada.`);

  const jaVinculada = await prisma.aeronavePeca.findUnique({
    where: { aeronaveId_pecaId: { aeronaveId: codigo, pecaId } },
  });
  if (jaVinculada) throw new AppError(409, "Esta peça já está vinculada à aeronave.");

  await prisma.aeronavePeca.create({ data: { aeronaveId: codigo, pecaId } });
  return obter(codigo);
}

export async function desvincularPeca(codigo: string, pecaId: string) {
  await garantirExiste(codigo);
  try {
    await prisma.aeronavePeca.delete({
      where: { aeronaveId_pecaId: { aeronaveId: codigo, pecaId } },
    });
  } catch {
    throw new AppError(404, "Esta peça não está vinculada à aeronave.");
  }
  return obter(codigo);
}

export async function adicionarTeste(
  codigo: string,
  tipo: TipoTeste,
  resultado: ResultadoTeste,
) {
  await garantirExiste(codigo);
  await prisma.teste.create({ data: { aeronaveId: codigo, tipo, resultado } });
  return obter(codigo);
}

export async function removerTeste(codigo: string, testeId: string) {
  await garantirExiste(codigo);
  try {
    await prisma.teste.delete({ where: { id: testeId } });
  } catch {
    throw new AppError(404, "Teste não encontrado.");
  }
  return obter(codigo);
}
