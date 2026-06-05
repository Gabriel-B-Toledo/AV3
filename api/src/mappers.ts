import { Prisma } from "@prisma/client";

// Define quais relações são carregadas e padroniza o formato JSON devolvido ao
// front-end (achatando as tabelas de junção).

export const aeronaveInclude = {
  pecas: { include: { peca: true } },
  etapas: { include: { responsaveis: { include: { funcionario: true } } } },
  testes: true,
} satisfies Prisma.AeronaveInclude;

export const funcionarioInclude = {
  etapas: { include: { etapa: { include: { aeronave: true } } } },
} satisfies Prisma.FuncionarioInclude;

type AeronaveCompleta = Prisma.AeronaveGetPayload<{ include: typeof aeronaveInclude }>;
type EtapaCompleta = Prisma.EtapaGetPayload<{
  include: { responsaveis: { include: { funcionario: true } } };
}>;
type FuncionarioCompleto = Prisma.FuncionarioGetPayload<{ include: typeof funcionarioInclude }>;
type PecaBase = Prisma.PecaGetPayload<object>;

export function mapPeca(p: PecaBase) {
  return {
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    fornecedor: p.fornecedor,
    status: p.status,
  };
}

export function mapEtapa(e: EtapaCompleta) {
  return {
    id: e.id,
    nome: e.nome,
    prazo: e.prazo,
    status: e.status,
    ordem: e.ordem,
    descricao: e.descricao ?? "",
    responsaveis: e.responsaveis.map((ef) => ({
      id: ef.funcionario.id,
      nome: ef.funcionario.nome,
      nivelPermissao: ef.funcionario.nivelPermissao,
    })),
  };
}

export function mapAeronave(a: AeronaveCompleta) {
  return {
    codigo: a.codigo,
    modelo: a.modelo,
    tipo: a.tipo,
    capacidade: a.capacidade,
    alcance: a.alcance,
    descricao: a.descricao ?? "",
    pecas: a.pecas.map((ap) => mapPeca(ap.peca)),
    etapas: [...a.etapas].sort((x, y) => x.ordem - y.ordem).map(mapEtapa),
    testes: a.testes.map((t) => ({ id: t.id, tipo: t.tipo, resultado: t.resultado })),
  };
}

export function mapFuncionario(f: FuncionarioCompleto) {
  return {
    id: f.id,
    nome: f.nome,
    usuario: f.usuario,
    telefone: f.telefone,
    endereco: f.endereco,
    nivelPermissao: f.nivelPermissao,
    processos: f.etapas.map((ef) => ({
      etapaId: ef.etapa.id,
      nome: ef.etapa.nome,
      aeronave: ef.etapa.aeronave.modelo,
      aeronaveCodigo: ef.etapa.aeronave.codigo,
      prazo: ef.etapa.prazo,
      status: ef.etapa.status,
    })),
  };
}
