"use client";
import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import { cls } from "../lib/helpers";
import { STATUS_PECA_LABEL, TIPO_PECA_LABEL, opcoes } from "../lib/labels";
import { podeGerir, podeOperar } from "../lib/perms";
import * as api from "../lib/api";
import type { Aeronave, PageProps, Peca, StatusPeca, TipoPeca } from "../lib/types";

export function Pecas({ data, reload, pushToast, perfil }: PageProps) {
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const statuses = useMemo(
    () => Array.from(new Set(data.pecas.map((p) => p.status))),
    [data.pecas],
  );
  const list = useMemo(
    () =>
      data.pecas.filter((p) => {
        const texto = `${p.id} ${p.nome} ${TIPO_PECA_LABEL[p.tipo]} ${p.fornecedor} ${STATUS_PECA_LABEL[p.status]}`;
        const m = texto.toLowerCase().includes(q.toLowerCase());
        const s = !filterStatus || p.status === filterStatus;
        return m && s;
      }),
    [data.pecas, q, filterStatus],
  );

  const usedIn = (pecaId: string): Aeronave[] =>
    data.aeronaves.filter((a) => a.pecas.some((p) => p.id === pecaId));

  const create = async (dados: api.NovaPeca) => {
    try {
      await api.criarPeca(dados);
      await reload();
      setOpenCreate(false);
      pushToast(`Peça ${dados.nome} criada.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao criar peça.");
    }
  };

  const alterarStatus = async (id: string, status: StatusPeca) => {
    try {
      await api.atualizarStatusPeca(id, status);
      await reload();
      pushToast(`Status atualizado para "${STATUS_PECA_LABEL[status]}".`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao atualizar status.");
    }
  };

  const detalhe = data.pecas.find((p) => p.id === openDetail);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Peças</h1>
          <div className="sub">
            {list.length} peça{list.length !== 1 ? "s" : ""} no catálogo.
          </div>
        </div>
        {podeGerir(perfil) && (
          <button type="button" className="btn btn-primary toolbar-cta" onClick={() => setOpenCreate(true)}>
            <Icon name="plus" />Criar
          </button>
        )}
      </div>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input
            placeholder="Buscar por nome, tipo ou fornecedor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="button" className="btn" onClick={() => setShowFilters((s) => !s)}>
          <Icon name="filter" />Filtros
          {filterStatus && <span className="tag" style={{ marginLeft: 4 }}>1</span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters">
          <span className="muted" style={{ fontSize: 12, marginRight: 6, alignSelf: "center" }}>Status:</span>
          <button
            type="button"
            className={cls("chip", !filterStatus && "active")}
            onClick={() => setFilterStatus("")}
          >
            Todos
          </button>
          {statuses.map((s) => (
            <button
              type="button"
              key={s}
              className={cls("chip", filterStatus === s && "active")}
              onClick={() => setFilterStatus(s)}
            >
              {STATUS_PECA_LABEL[s]}
            </button>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} className="empty">Nenhuma peça encontrada.</td></tr>
              ) : (
                list.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="name">{p.nome}</div>
                      <div className="mono" style={{ marginTop: 2 }}>{p.id}</div>
                    </td>
                    <td>{TIPO_PECA_LABEL[p.tipo]}</td>
                    <td>{p.fornecedor}</td>
                    <td><StatusPill value={p.status} label={STATUS_PECA_LABEL[p.status]} /></td>
                    <td className="col-actions">
                      <button type="button" className="btn btn-sm" onClick={() => setOpenDetail(p.id)}>
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
        <CriarPeca
          onClose={() => setOpenCreate(false)}
          onCreate={create}
          existingIds={data.pecas.map((p) => p.id)}
        />
      )}
      {detalhe && (
        <PecaDetail
          peca={detalhe}
          usedIn={usedIn(detalhe.id)}
          perfil={perfil}
          onAlterarStatus={(s) => alterarStatus(detalhe.id, s)}
          onClose={() => setOpenDetail(null)}
        />
      )}
    </div>
  );
}

interface CriarPecaProps {
  onClose: () => void;
  onCreate: (p: api.NovaPeca) => void;
  existingIds: string[];
}

function CriarPeca({ onClose, onCreate, existingIds }: CriarPecaProps) {
  const [f, setF] = useState<api.NovaPeca>({
    id: "",
    nome: "",
    tipo: "NACIONAL",
    fornecedor: "",
    status: "EM_PRODUCAO",
  });
  const [erro, setErro] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.id || !f.nome) return;
    if (existingIds.includes(f.id)) {
      setErro("Código já existe.");
      return;
    }
    onCreate(f);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>Criar peça</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>Código</label>
              <input
                value={f.id}
                onChange={(e) => setF({ ...f, id: e.target.value.toUpperCase() })}
                placeholder="P-XXXX"
                required
              />
              {erro && <span className="help err">{erro}</span>}
            </div>
            <div className="field">
              <label>Nome da peça</label>
              <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select
                value={f.tipo}
                onChange={(e) => setF({ ...f, tipo: e.target.value as TipoPeca })}
              >
                {opcoes(TIPO_PECA_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Fornecedor</label>
              <input value={f.fornecedor} onChange={(e) => setF({ ...f, fornecedor: e.target.value })} />
            </div>
            <div className="field field-full">
              <label>Status</label>
              <select
                value={f.status}
                onChange={(e) => setF({ ...f, status: e.target.value as StatusPeca })}
              >
                {opcoes(STATUS_PECA_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary"><Icon name="plus" />Criar peça</button>
        </div>
      </form>
    </div>
  );
}

interface PecaDetailProps {
  peca: Peca;
  usedIn: Aeronave[];
  perfil: PageProps["perfil"];
  onAlterarStatus: (status: StatusPeca) => void;
  onClose: () => void;
}

function PecaDetail({ peca, usedIn, perfil, onAlterarStatus, onClose }: PecaDetailProps) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal cmp" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Peça · {peca.id}</div>
            <h2>{peca.nome}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div>
            <div className="section-h">
              <h3>Detalhes</h3>
              <StatusPill value={peca.status} label={STATUS_PECA_LABEL[peca.status]} />
            </div>
            <dl className="kv">
              <dt>Tipo</dt><dd>{TIPO_PECA_LABEL[peca.tipo]}</dd>
              <dt>Fornecedor</dt><dd>{peca.fornecedor}</dd>
            </dl>
            {podeOperar(perfil) && (
              <div className="field" style={{ marginTop: 12 }}>
                <label>Atualizar status</label>
                <select
                  value={peca.status}
                  onChange={(e) => onAlterarStatus(e.target.value as StatusPeca)}
                >
                  {opcoes(STATUS_PECA_LABEL).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <div className="section-h"><h3>Em uso</h3></div>
            {usedIn.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>
                Esta peça ainda não está vinculada a nenhuma aeronave.
              </div>
            ) : (
              <div className="list">
                {usedIn.map((a) => (
                  <div key={a.codigo} className="row-card">
                    <div className="meta">
                      <div className="row-title">{a.modelo}</div>
                      <div className="row-sub">{a.codigo}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
