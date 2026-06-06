"use client";
import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import { cls, fmtDate, initials } from "../lib/helpers";
import { NIVEL_LABEL, STATUS_ETAPA_LABEL, opcoes } from "../lib/labels";
import { ehAdmin } from "../lib/perms";
import * as api from "../lib/api";
import type { Funcionario, NivelPermissao, PageProps } from "../lib/types";

export function Funcionarios({ data, reload, pushToast, perfil }: PageProps) {
  const [q, setQ] = useState("");
  const [filterPerm, setFilterPerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const perms = useMemo(
    () => Array.from(new Set(data.funcionarios.map((f) => f.nivelPermissao))),
    [data.funcionarios],
  );
  const list = useMemo(
    () =>
      data.funcionarios.filter((f) => {
        const texto = `${f.id} ${f.nome} ${f.usuario} ${NIVEL_LABEL[f.nivelPermissao]}`;
        const m = texto.toLowerCase().includes(q.toLowerCase());
        const p = !filterPerm || f.nivelPermissao === filterPerm;
        return m && p;
      }),
    [data.funcionarios, q, filterPerm],
  );

  const create = async (dados: api.NovoFuncionario) => {
    try {
      await api.criarFuncionario(dados);
      await reload();
      setOpenCreate(false);
      pushToast(`${dados.nome} cadastrado.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao cadastrar funcionário.");
    }
  };

  const editar = async (id: string, dados: api.AtualizaFuncionario): Promise<boolean> => {
    try {
      await api.atualizarFuncionario(id, dados);
      await reload();
      pushToast("Funcionário atualizado.");
      return true;
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao atualizar funcionário.");
      return false;
    }
  };

  const excluir = async (id: string) => {
    try {
      await api.removerFuncionario(id);
      await reload();
      setOpenDetail(null);
      pushToast("Funcionário excluído.");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao excluir funcionário.");
    }
  };

  const usuarioLogadoId = api.getUsuarioSalvo()?.id ?? null;
  const detalhe = data.funcionarios.find((f) => f.id === openDetail);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Funcionários</h1>
          <div className="sub">
            {list.length} funcionário{list.length !== 1 ? "s" : ""} cadastrado
            {list.length !== 1 ? "s" : ""}.
          </div>
        </div>
        {ehAdmin(perfil) && (
          <button type="button" className="btn btn-primary toolbar-cta" onClick={() => setOpenCreate(true)}>
            <Icon name="plus" />Cadastrar
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input
            placeholder="Buscar por nome, usuário ou permissão…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="button" className="btn" onClick={() => setShowFilters((s) => !s)}>
          <Icon name="filter" />Filtros
          {filterPerm && <span className="tag" style={{ marginLeft: 4 }}>1</span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters">
          <span className="muted" style={{ fontSize: 12, marginRight: 6, alignSelf: "center" }}>
            Permissão:
          </span>
          <button
            type="button"
            className={cls("chip", !filterPerm && "active")}
            onClick={() => setFilterPerm("")}
          >
            Todas
          </button>
          {perms.map((p) => (
            <button
              type="button"
              key={p}
              className={cls("chip", filterPerm === p && "active")}
              onClick={() => setFilterPerm(p)}
            >
              {NIVEL_LABEL[p]}
            </button>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Permissão</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} className="empty">Nenhum funcionário encontrado.</td></tr>
              ) : (
                list.map((f) => (
                  <tr key={f.id}>
                    <td><span className="mono">{f.id}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar">{initials(f.nome)}</div>
                        <span className="name">{f.nome}</span>
                      </div>
                    </td>
                    <td className="mono">{f.usuario}</td>
                    <td><span className="tag">{NIVEL_LABEL[f.nivelPermissao]}</span></td>
                    <td className="col-actions">
                      <button type="button" className="btn btn-sm" onClick={() => setOpenDetail(f.id)}>
                        Detalhes <Icon name="chev" size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openCreate && (
        <CadastrarFuncionario
          onClose={() => setOpenCreate(false)}
          onCreate={create}
          existingIds={data.funcionarios.map((f) => f.id)}
        />
      )}
      {detalhe && (
        <FuncionarioDetail
          func={detalhe}
          perfil={perfil}
          usuarioLogadoId={usuarioLogadoId}
          onEditar={editar}
          onExcluir={excluir}
          onClose={() => setOpenDetail(null)}
        />
      )}
    </div>
  );
}

interface CadastrarFuncionarioProps {
  onClose: () => void;
  onCreate: (f: api.NovoFuncionario) => void;
  existingIds: string[];
}

function CadastrarFuncionario({ onClose, onCreate, existingIds }: CadastrarFuncionarioProps) {
  const [f, setF] = useState({
    id: "",
    nome: "",
    usuario: "",
    nivelPermissao: "OPERADOR" as NivelPermissao,
    senha: "",
    telefone: "",
    confirmar: "",
    endereco: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.id.trim()) e.id = "Obrigatório";
    else if (existingIds.includes(f.id.trim())) e.id = "ID já existe";
    if (!f.nome.trim()) e.nome = "Obrigatório";
    if (!f.usuario.trim()) e.usuario = "Obrigatório";
    if (!f.telefone.trim()) e.telefone = "Obrigatório";
    if (!f.endereco.trim()) e.endereco = "Obrigatório";
    if (!f.senha) e.senha = "Obrigatório";
    else if (f.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (f.confirmar !== f.senha) e.confirmar = "As senhas não coincidem";
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onCreate({
      id: f.id.trim(),
      nome: f.nome,
      usuario: f.usuario,
      telefone: f.telefone,
      endereco: f.endereco,
      senha: f.senha,
      nivelPermissao: f.nivelPermissao,
    });
  };

  return (
    <div className="scrim" onClick={onClose}>
      <form className="modal" onClick={(ev) => ev.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2 className="uc">Cadastrar Funcionário</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>ID (único)</label>
              <input
                value={f.id}
                onChange={(ev) => set("id", ev.target.value.toUpperCase())}
                placeholder="F-XXX"
              />
              {errors.id && <span className="help err">{errors.id}</span>}
            </div>
            <div className="field">
              <label>Nome completo</label>
              <input
                value={f.nome}
                onChange={(ev) => set("nome", ev.target.value)}
                placeholder="Ex.: Gerson Costa"
              />
              {errors.nome && <span className="help err">{errors.nome}</span>}
            </div>
            <div className="field">
              <label>Usuário</label>
              <input
                value={f.usuario}
                onChange={(ev) => set("usuario", ev.target.value)}
                placeholder="seu.usuario"
              />
              {errors.usuario && <span className="help err">{errors.usuario}</span>}
            </div>
            <div className="field">
              <label>Permissão</label>
              <select
                value={f.nivelPermissao}
                onChange={(ev) => set("nivelPermissao", ev.target.value as NivelPermissao)}
              >
                {opcoes(NIVEL_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                value={f.senha}
                onChange={(ev) => set("senha", ev.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.senha && <span className="help err">{errors.senha}</span>}
            </div>
            <div className="field">
              <label>Número de Telefone</label>
              <input
                value={f.telefone}
                onChange={(ev) => set("telefone", ev.target.value)}
                placeholder="+55 12 99999-0000"
              />
              {errors.telefone && <span className="help err">{errors.telefone}</span>}
            </div>
            <div className="field">
              <label>Confirmar Senha</label>
              <input
                type="password"
                value={f.confirmar}
                onChange={(ev) => set("confirmar", ev.target.value)}
                placeholder="Repita a senha"
              />
              {errors.confirmar && <span className="help err">{errors.confirmar}</span>}
            </div>
            <div className="field">
              <label>Endereço</label>
              <input
                value={f.endereco}
                onChange={(ev) => set("endereco", ev.target.value)}
                placeholder="Rua, número - cidade"
              />
              {errors.endereco && <span className="help err">{errors.endereco}</span>}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost btn-uc" onClick={onClose}>
            Voltar
          </button>
          <button type="submit" className="btn btn-primary btn-uc">
            Cadastrar <Icon name="plus" size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

interface FuncionarioDetailProps {
  func: Funcionario;
  perfil: NivelPermissao;
  usuarioLogadoId: string | null;
  onEditar: (id: string, dados: api.AtualizaFuncionario) => Promise<boolean>;
  onExcluir: (id: string) => void;
  onClose: () => void;
}

function FuncionarioDetail({ func, perfil, usuarioLogadoId, onEditar, onExcluir, onClose }: FuncionarioDetailProps) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const admin = ehAdmin(perfil);
  const ehProprio = usuarioLogadoId === func.id;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: 14 }}>
              {initials(func.nome)}
            </div>
            <div>
              <div className="eyebrow">Funcionário · {func.id}</div>
              <h2>{func.nome}</h2>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div>
            <div className="section-h">
              <h3>Dados</h3>
              <span className="tag">{NIVEL_LABEL[func.nivelPermissao]}</span>
            </div>
            <dl className="kv">
              <dt>Usuário</dt><dd className="mono">{func.usuario}</dd>
              <dt>Telefone</dt><dd>{func.telefone}</dd>
              <dt>Endereço</dt><dd>{func.endereco}</dd>
            </dl>
          </div>
          <div>
            <div className="section-h">
              <h3>Processos em andamento ({func.processos.length})</h3>
            </div>
            {func.processos.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>
                Sem processos atribuídos no momento.
              </div>
            ) : (
              <div className="list">
                {func.processos.map((p) => (
                  <div className="row-card" key={p.etapaId}>
                    <div className="meta">
                      <div className="row-title">{p.nome}</div>
                      <div className="row-sub">
                        {p.aeronave} · prazo {fmtDate(p.prazo)}
                      </div>
                    </div>
                    <StatusPill value={p.status} label={STATUS_ETAPA_LABEL[p.status]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          {admin && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginRight: "auto" }}
              onClick={() => setConfirmando(true)}
              disabled={ehProprio}
              title={ehProprio ? "Você não pode excluir o próprio usuário." : "Excluir funcionário"}
            >
              <Icon name="trash" size={14} />Excluir
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
          {admin && (
            <button type="button" className="btn btn-primary" onClick={() => setEditando(true)}>
              <Icon name="edit" size={14} />Editar
            </button>
          )}
        </div>
      </div>

      {editando && (
        <EditarFuncionario
          func={func}
          onClose={() => setEditando(false)}
          onSave={async (dados) => {
            const ok = await onEditar(func.id, dados);
            if (ok) setEditando(false);
          }}
        />
      )}
      {confirmando && (
        <ConfirmarExclusao
          nome={func.nome}
          onCancel={() => setConfirmando(false)}
          onConfirm={() => {
            setConfirmando(false);
            onExcluir(func.id);
          }}
        />
      )}
    </div>
  );
}

interface EditarFuncionarioProps {
  func: Funcionario;
  onClose: () => void;
  onSave: (dados: api.AtualizaFuncionario) => void;
}

function EditarFuncionario({ func, onClose, onSave }: EditarFuncionarioProps) {
  const [f, setF] = useState({
    nome: func.nome,
    telefone: func.telefone,
    endereco: func.endereco,
    nivelPermissao: func.nivelPermissao,
    senha: "",
    confirmar: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!f.nome.trim()) e.nome = "Obrigatório";
    if (!f.telefone.trim()) e.telefone = "Obrigatório";
    if (!f.endereco.trim()) e.endereco = "Obrigatório";
    if (f.senha && f.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (f.senha && f.confirmar !== f.senha) e.confirmar = "As senhas não coincidem";
    setErrors(e);
    if (Object.keys(e).length) return;

    const dados: api.AtualizaFuncionario = {
      nome: f.nome,
      telefone: f.telefone,
      endereco: f.endereco,
      nivelPermissao: f.nivelPermissao,
    };
    if (f.senha) dados.senha = f.senha;
    onSave(dados);
  };

  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 70 }}>
      <form className="modal" onClick={(ev) => ev.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2 className="uc">Editar Funcionário</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>ID</label>
              <input value={func.id} disabled />
            </div>
            <div className="field">
              <label>Usuário</label>
              <input value={func.usuario} disabled />
            </div>
            <div className="field">
              <label>Nome completo</label>
              <input value={f.nome} onChange={(ev) => set("nome", ev.target.value)} />
              {errors.nome && <span className="help err">{errors.nome}</span>}
            </div>
            <div className="field">
              <label>Permissão</label>
              <select
                value={f.nivelPermissao}
                onChange={(ev) => set("nivelPermissao", ev.target.value as NivelPermissao)}
              >
                {opcoes(NIVEL_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Número de Telefone</label>
              <input value={f.telefone} onChange={(ev) => set("telefone", ev.target.value)} />
              {errors.telefone && <span className="help err">{errors.telefone}</span>}
            </div>
            <div className="field">
              <label>Endereço</label>
              <input value={f.endereco} onChange={(ev) => set("endereco", ev.target.value)} />
              {errors.endereco && <span className="help err">{errors.endereco}</span>}
            </div>
            <div className="field">
              <label>Nova senha (opcional)</label>
              <input
                type="password"
                value={f.senha}
                onChange={(ev) => set("senha", ev.target.value)}
                placeholder="Deixe em branco para manter"
              />
              {errors.senha && <span className="help err">{errors.senha}</span>}
            </div>
            <div className="field">
              <label>Confirmar nova senha</label>
              <input
                type="password"
                value={f.confirmar}
                onChange={(ev) => set("confirmar", ev.target.value)}
                placeholder="Repita a nova senha"
              />
              {errors.confirmar && <span className="help err">{errors.confirmar}</span>}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost btn-uc" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-uc">
            Salvar <Icon name="check" size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

interface ConfirmarExclusaoProps {
  nome: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmarExclusao({ nome, onCancel, onConfirm }: ConfirmarExclusaoProps) {
  return (
    <div className="scrim" onClick={onCancel} style={{ paddingTop: 120 }}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Excluir funcionário</h2>
          <button type="button" className="icon-btn" onClick={onCancel}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
            Tem certeza que deseja excluir <b>{nome}</b>? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            <Icon name="trash" size={14} />Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
