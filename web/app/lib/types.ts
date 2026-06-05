// Tipos do front-end, alinhados ao contrato da API (enums idênticos à AV1).

export type TipoAeronave = "COMERCIAL" | "MILITAR";
export type TipoPeca = "NACIONAL" | "IMPORTADA";
export type StatusPeca = "EM_PRODUCAO" | "EM_TRANSPORTE" | "PRONTA";
export type StatusEtapa = "PENDENTE" | "ANDAMENTO" | "CONCLUIDA";
export type NivelPermissao = "ADMINISTRADOR" | "ENGENHEIRO" | "OPERADOR";
export type TipoTeste = "ELETRICO" | "HIDRAULICO" | "AERODINAMICO";
export type ResultadoTeste = "APROVADO" | "REPROVADO";

export interface Responsavel {
  id: string;
  nome: string;
  nivelPermissao: NivelPermissao;
}

export interface Etapa {
  id: string;
  nome: string;
  prazo: string;
  status: StatusEtapa;
  ordem: number;
  descricao: string;
  responsaveis: Responsavel[];
}

export interface Teste {
  id: string;
  tipo: TipoTeste;
  resultado: ResultadoTeste;
}

export interface Peca {
  id: string;
  nome: string;
  tipo: TipoPeca;
  fornecedor: string;
  status: StatusPeca;
}

export interface Aeronave {
  codigo: string;
  modelo: string;
  tipo: TipoAeronave;
  capacidade: number;
  alcance: number;
  descricao: string;
  etapas: Etapa[];
  pecas: Peca[];
  testes: Teste[];
}

export interface Processo {
  etapaId: string;
  nome: string;
  aeronave: string;
  aeronaveCodigo: string;
  prazo: string;
  status: StatusEtapa;
}

export interface Funcionario {
  id: string;
  nome: string;
  usuario: string;
  telefone: string;
  endereco: string;
  nivelPermissao: NivelPermissao;
  processos: Processo[];
}

export interface DataState {
  funcionarios: Funcionario[];
  pecas: Peca[];
  aeronaves: Aeronave[];
}

export interface Usuario {
  id: string;
  nome: string;
  usuario: string;
  nivelPermissao: NivelPermissao;
}

export type Route = "home" | "aeronaves" | "pecas" | "funcionarios";

export interface Toast {
  id: string;
  msg: string;
}

// Props comuns às páginas de gestão (consomem a API e recarregam os dados).
export interface PageProps {
  data: DataState;
  reload: () => Promise<void>;
  pushToast: (msg: string) => void;
  perfil: NivelPermissao;
}
