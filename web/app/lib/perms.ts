import type { NivelPermissao } from "./types";

export const ehAdmin =(n?: NivelPermissao): boolean => n === "ADMINISTRADOR";
export const podeGerir = (n?: NivelPermissao): boolean =>
  n === "ADMINISTRADOR" || n === "ENGENHEIRO";
export const podeOperar = (n?: NivelPermissao): boolean => podeGerir(n) || n === "OPERADOR";
