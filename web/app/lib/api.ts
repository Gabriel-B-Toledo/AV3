import type {
  Aeronave,
  DataState,
  Funcionario,
  NivelPermissao,
  Peca,
  ResultadoTeste,
  StatusPeca,
  TipoAeronave,
  TipoPeca,
  TipoTeste,
  Usuario,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "aerocode-token";
const USER_KEY = "aerocode-user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuarioSalvo(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

function setSession(token: string, usuario: Usuario): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.includes("/auth/login")) {
      logout();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("aerocode:unauthorized"));
      }
    }
    const msg = data && typeof data.error === "string" ? data.error : `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function login(usuario: string, senha: string): Promise<Usuario> {
  const res = await request<{ token: string; usuario: Usuario }>("POST", "/api/auth/login", {
    usuario,
    senha,
  });
  setSession(res.token, res.usuario);
  return res.usuario;
}

export async function fetchAll(): Promise<DataState> {
  const [aeronaves, pecas, funcionarios] = await Promise.all([
    request<Aeronave[]>("GET", "/api/aeronaves"),
    request<Peca[]>("GET", "/api/pecas"),
    request<Funcionario[]>("GET", "/api/funcionarios"),
  ]);
  return { aeronaves, pecas, funcionarios };
}

export interface NovaAeronave {
  codigo: string;
  modelo: string;
  tipo: TipoAeronave;
  capacidade: number;
  alcance: number;
  descricao?: string;
}

export const criarAeronave = (dados: NovaAeronave) =>
  request<Aeronave>("POST", "/api/aeronaves", dados);
export const atualizarAeronave = (codigo: string, dados: Partial<Omit<NovaAeronave, "codigo">>) =>
  request<Aeronave>("PUT", `/api/aeronaves/${codigo}`, dados);
export const removerAeronave = (codigo: string) =>
  request<void>("DELETE", `/api/aeronaves/${codigo}`);
export const vincularPeca = (codigo: string, pecaId: string) =>
  request<Aeronave>("POST", `/api/aeronaves/${codigo}/pecas`, { pecaId });
export const desvincularPeca = (codigo: string, pecaId: string) =>
  request<Aeronave>("DELETE", `/api/aeronaves/${codigo}/pecas/${pecaId}`);
export const adicionarTeste = (codigo: string, tipo: TipoTeste, resultado: ResultadoTeste) =>
  request<Aeronave>("POST", `/api/aeronaves/${codigo}/testes`, { tipo, resultado });
export const removerTeste = (codigo: string, testeId: string) =>
  request<Aeronave>("DELETE", `/api/aeronaves/${codigo}/testes/${testeId}`);
export const criarEtapa = (
  codigo: string,
  dados: { nome: string; prazo: string; descricao?: string },
) => request<Aeronave>("POST", `/api/aeronaves/${codigo}/etapas`, dados);
export const gerarRelatorio = (codigo: string, nomeCliente: string, dataEntrega: string) =>
  request<{ texto: string; arquivo: string }>("POST", `/api/aeronaves/${codigo}/relatorio`, {
    nomeCliente,
    dataEntrega,
  });

export const alterarStatusEtapa = (id: string, acao: "iniciar" | "finalizar" | "reabrir") =>
  request<{ ok: true }>("PATCH", `/api/etapas/${id}/status`, { acao });
export const associarResponsavel = (id: string, funcionarioId: string) =>
  request<{ ok: true }>("POST", `/api/etapas/${id}/responsaveis`, { funcionarioId });
export const removerResponsavel = (id: string, funcId: string) =>
  request<void>("DELETE", `/api/etapas/${id}/responsaveis/${funcId}`);

export interface NovaPeca {
  id: string;
  nome: string;
  tipo: TipoPeca;
  fornecedor: string;
  status?: StatusPeca;
}

export const criarPeca = (dados: NovaPeca) => request<Peca>("POST", "/api/pecas", dados);
export const atualizarStatusPeca = (id: string, status: StatusPeca) =>
  request<Peca>("PATCH", `/api/pecas/${id}/status`, { status });

export interface NovoFuncionario {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  usuario: string;
  senha: string;
  nivelPermissao: NivelPermissao;
}

export interface AtualizaFuncionario {
  nome?: string;
  telefone?: string;
  endereco?: string;
  senha?: string;
  nivelPermissao?: NivelPermissao;
}

export const criarFuncionario = (dados: NovoFuncionario) =>
  request<Funcionario>("POST", "/api/funcionarios", dados);
export const atualizarFuncionario = (id: string, dados: AtualizaFuncionario) =>
  request<Funcionario>("PUT", `/api/funcionarios/${id}`, dados);
export const removerFuncionario = (id: string) =>
  request<void>("DELETE", `/api/funcionarios/${id}`);
