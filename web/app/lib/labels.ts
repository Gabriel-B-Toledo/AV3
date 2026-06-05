import type {
  TipoAeronave,
  TipoPeca,
  StatusPeca,
  StatusEtapa,
  NivelPermissao,
  TipoTeste,
  ResultadoTeste,
} from "./types";

export const TIPO_AERONAVE_LABEL: Record<TipoAeronave, string> = {
  COMERCIAL: "Comercial",
  MILITAR: "Militar",
};
export const TIPO_PECA_LABEL: Record<TipoPeca, string> = {
  NACIONAL: "Nacional",
  IMPORTADA: "Importada",
};
export const STATUS_PECA_LABEL: Record<StatusPeca, string> = {
  EM_PRODUCAO: "Em produção",
  EM_TRANSPORTE: "Em transporte",
  PRONTA: "Pronta",
};
export const STATUS_ETAPA_LABEL: Record<StatusEtapa, string> = {
  PENDENTE: "Pendente",
  ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluído",
};
export const NIVEL_LABEL: Record<NivelPermissao, string> = {
  ADMINISTRADOR: "Administrador",
  ENGENHEIRO: "Engenheiro",
  OPERADOR: "Operador",
};
export const TIPO_TESTE_LABEL: Record<TipoTeste, string> = {
  ELETRICO: "Elétrico",
  HIDRAULICO: "Hidráulico",
  AERODINAMICO: "Aerodinâmico",
};
export const RESULTADO_LABEL: Record<ResultadoTeste, string> = {
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

export const TONE: Record<string, string> = {
  CONCLUIDA: "pill-ok",
  ANDAMENTO: "pill-info",
  PENDENTE: "pill-warn",
  PRONTA: "pill-ok",
  EM_TRANSPORTE: "pill-info",
  EM_PRODUCAO: "pill-warn",
  APROVADO: "pill-ok",
  REPROVADO: "pill-danger",
};

export function opcoes<T extends string>(mapa: Record<T, string>): Array<{ value: T; label: string }> {
  return (Object.keys(mapa) as T[]).map((value) => ({ value, label: mapa[value] }));
}
