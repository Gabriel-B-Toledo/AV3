import bcrypt from "bcryptjs";
import { NivelPermissao } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../http";
import { funcionarioInclude, mapFuncionario } from "../mappers";

export interface DadosFuncionario {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  usuario: string;
  senha: string;
  nivelPermissao: NivelPermissao;
}

export async function listar() {
  const funcs = await prisma.funcionario.findMany({
    include: funcionarioInclude,
    orderBy: { id: "asc" },
  });
  return funcs.map(mapFuncionario);
}

export async function obter(id: string) {
  const f = await prisma.funcionario.findUnique({ where: { id }, include: funcionarioInclude });
  if (!f) throw new AppError(404, `Funcionário "${id}" não encontrado.`);
  return mapFuncionario(f);
}

export async function criar(dados: DadosFuncionario) {
  const [porId, porUsuario] = await Promise.all([
    prisma.funcionario.findUnique({ where: { id: dados.id } }),
    prisma.funcionario.findUnique({ where: { usuario: dados.usuario } }),
  ]);
  if (porId) throw new AppError(409, `Já existe um funcionário com o ID "${dados.id}".`);
  if (porUsuario) throw new AppError(409, `O usuário "${dados.usuario}" já está em uso.`);

  const senhaHash = await bcrypt.hash(dados.senha, 10);
  await prisma.funcionario.create({
    data: {
      id: dados.id,
      nome: dados.nome,
      telefone: dados.telefone,
      endereco: dados.endereco,
      usuario: dados.usuario,
      senhaHash,
      nivelPermissao: dados.nivelPermissao,
    },
  });
  return obter(dados.id);
}

export async function atualizar(
  id: string,
  dados: Partial<Omit<DadosFuncionario, "id" | "usuario">>,
) {
  const f = await prisma.funcionario.findUnique({ where: { id } });
  if (!f) throw new AppError(404, `Funcionário "${id}" não encontrado.`);

  const data: Record<string, unknown> = {};
  if (dados.nome !== undefined) data.nome = dados.nome;
  if (dados.telefone !== undefined) data.telefone = dados.telefone;
  if (dados.endereco !== undefined) data.endereco = dados.endereco;
  if (dados.nivelPermissao !== undefined) data.nivelPermissao = dados.nivelPermissao;
  if (dados.senha) data.senhaHash = await bcrypt.hash(dados.senha, 10);

  await prisma.funcionario.update({ where: { id }, data });
  return obter(id);
}

export async function remover(id: string) {
  const f = await prisma.funcionario.findUnique({ where: { id } });
  if (!f) throw new AppError(404, `Funcionário "${id}" não encontrado.`);
  await prisma.funcionario.delete({ where: { id } });
}
