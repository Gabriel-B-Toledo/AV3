"use client";
import { useState } from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import { cls, fmtDate, daysUntil, initials } from "../lib/helpers";
import {
  TIPO_AERONAVE_LABEL,
  STATUS_ETAPA_LABEL,
  STATUS_PECA_LABEL,
  TIPO_PECA_LABEL,
  TIPO_TESTE_LABEL,
  RESULTADO_LABEL,
  NIVEL_LABEL,
  opcoes,
} from "../lib/labels";
import { podeGerir, podeOperar } from "../lib/perms";
import * as api from "../lib/api";
import type {
  Aeronave,
  Etapa,
  Funcionario,
  NivelPermissao,
  PageProps,
  Peca,
  ResultadoTeste,
  StatusEtapa,
  TipoAeronave,
  TipoTeste,
} from "../lib/types";

const acaoPara = (s: StatusEtapa): "iniciar" | "finalizar" | "reabrir" =>
  s === "PENDENTE" ? "iniciar" : s === "ANDAMENTO" ? "finalizar" : "reabrir";

type Bloqueio = { tipo: "iniciar" | "finalizar"; bloqueadora: Etapa };

function bloqueioDe(etapa: Etapa, etapas: Etapa[]): Bloqueio | null {
  if (etapa.status === "PENDENTE") {
    const emAndamento = etapas.find((e) => e.status === "ANDAMENTO" && e.id !== etapa.id);
    if (emAndamento) return { tipo: "iniciar", bloqueadora: emAndamento };
  }
  if (etapa.status === "ANDAMENTO") {
    const anterior = etapas
      .filter((e) => e.ordem < etapa.ordem && e.status !== "CONCLUIDA")
      .sort((a, b) => a.ordem - b.ordem)[0];
    if (anterior) return { tipo: "finalizar", bloqueadora: anterior };
  }
  return null;
}

export function Aeronaves({ data, reload, pushToast, perfil }: PageProps) {
  const [q, setQ] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const tipos = Array.from(new Set(data.aeronaves.map((a) => a.tipo)));
  const list = data.aeronaves.filter((a) => {
    const texto = `${a.codigo} ${a.modelo} ${TIPO_AERONAVE_LABEL[a.tipo]}`;
    const m = texto.toLowerCase().includes(q.toLowerCase());
    const t = !filterTipo || a.tipo === filterTipo;
    return m && t;
  });

  const criar = async (dados: api.NovaAeronave) => {
    try {
      await api.criarAeronave(dados);
      await reload();
      setOpenCreate(false);
      pushToast(`Aeronave ${dados.codigo} ${dados.modelo} cadastrada.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao cadastrar aeronave.");
    }
  };

  const detalhe = data.aeronaves.find((a) => a.codigo === openDetail);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Aeronaves</h1>
          <div className="sub">
            {list.length} aeronave{list.length !== 1 ? "s" : ""} em produção · clique em <b>Detalhes</b> para abrir.
          </div>
        </div>
        {podeGerir(perfil) && (
          <button type="button" className="btn btn-primary toolbar-cta" onClick={() => setOpenCreate(true)}>
            <Icon name="plus" />
            Cadastrar
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input
            placeholder="Buscar por código, nome ou tipo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="button" className="btn" onClick={() => setShowFilters((s) => !s)}>
          <Icon name="filter" />
          Filtros
          {filterTipo && <span className="tag" style={{ marginLeft: 4 }}>1</span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters">
          <span className="muted" style={{ fontSize: 12, marginRight: 6, alignSelf: "center" }}>Tipo:</span>
          <button type="button" className={cls("chip", !filterTipo && "active")} onClick={() => setFilterTipo("")}>Todos</button>
          {tipos.map((t) => (
            <button
              type="button"
              key={t}
              className={cls("chip", filterTipo === t && "active")}
              onClick={() => setFilterTipo(t)}
            >
              {TIPO_AERONAVE_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Capacidade</th>
                <th>Alcance</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">Nenhuma aeronave encontrada.</td>
                </tr>
              ) : (
                list.map((a) => (
                  <tr key={a.codigo}>
                    <td><span className="mono">{a.codigo}</span></td>
                    <td><span className="name">{a.modelo}</span></td>
                    <td>{TIPO_AERONAVE_LABEL[a.tipo]}</td>
                    <td>{a.capacidade}</td>
                    <td>{a.alcance} km</td>
                    <td className="col-actions">
                      <button type="button" className="btn btn-sm" onClick={() => setOpenDetail(a.codigo)}>
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

      {detalhe && (
        <AeronaveDetail
          aeronave={detalhe}
          allFunc={data.funcionarios}
          allPecas={data.pecas}
          perfil={perfil}
          reload={reload}
          pushToast={pushToast}
          onClose={() => setOpenDetail(null)}
        />
      )}
      {openCreate && (
        <CadastrarAeronave onClose={() => setOpenCreate(false)} onCreate={criar} />
      )}
    </div>
  );
}

interface AeronaveDetailProps {
  aeronave: Aeronave;
  allFunc: Funcionario[];
  allPecas: Peca[];
  perfil: NivelPermissao;
  reload: () => Promise<void>;
  pushToast: (msg: string) => void;
  onClose: () => void;
}

function AeronaveDetail({ aeronave, allFunc, allPecas, perfil, reload, pushToast, onClose }: AeronaveDetailProps) {
  const [openEtapa, setOpenEtapa] = useState<string | null>(null);
  const [openAddEtapa, setOpenAddEtapa] = useState(false);
  const [openAddPeca, setOpenAddPeca] = useState(false);
  const [openAddTeste, setOpenAddTeste] = useState(false);
  const [openRelatorio, setOpenRelatorio] = useState(false);
  const [bloqueioInfo, setBloqueioInfo] = useState<{ etapa: Etapa; bloqueio: Bloqueio } | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const gerir = podeGerir(perfil);
  const operar = podeOperar(perfil);

  const toggleEtapaStatus = async (etapa: Etapa) => {
    if (processandoId) return;
    setProcessandoId(etapa.id);
    try {
      await api.alterarStatusEtapa(etapa.id, acaoPara(etapa.status));
      await reload();
      pushToast(`Etapa "${etapa.nome}" atualizada.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao mudar status da etapa.");
    } finally {
      setProcessandoId(null);
    }
  };

  const acionarEtapa = (etapa: Etapa) => {
    const bloqueio = bloqueioDe(etapa, aeronave.etapas);
    if (bloqueio) setBloqueioInfo({ etapa, bloqueio });
    else toggleEtapaStatus(etapa);
  };

  const addEtapa = async (dados: { nome: string; prazo: string; descricao?: string }) => {
    try {
      await api.criarEtapa(aeronave.codigo, dados);
      await reload();
      setOpenAddEtapa(false);
      pushToast(`Etapa "${dados.nome}" criada.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao criar etapa.");
    }
  };

  const addPeca = async (pecaId: string) => {
    try {
      await api.vincularPeca(aeronave.codigo, pecaId);
      await reload();
      setOpenAddPeca(false);
      pushToast("Peça vinculada.");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao vincular peça.");
    }
  };

  const removePeca = async (pecaId: string) => {
    try {
      await api.desvincularPeca(aeronave.codigo, pecaId);
      await reload();
      pushToast("Peça removida.");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao remover peça.");
    }
  };

  const addTeste = async (tipo: TipoTeste, resultado: ResultadoTeste) => {
    try {
      await api.adicionarTeste(aeronave.codigo, tipo, resultado);
      await reload();
      setOpenAddTeste(false);
      pushToast("Teste registrado.");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao registrar teste.");
    }
  };

  const removeTeste = async (testeId: string) => {
    try {
      await api.removerTeste(aeronave.codigo, testeId);
      await reload();
      pushToast("Teste removido.");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao remover teste.");
    }
  };

  const etapaAberta = aeronave.etapas.find((e) => e.id === openEtapa);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Aeronave · {aeronave.codigo}</div>
            <h2>{aeronave.modelo}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div>
              <div className="section-h"><h3>Detalhes</h3></div>
              <dl className="kv">
                <dt>Tipo</dt><dd>{TIPO_AERONAVE_LABEL[aeronave.tipo]}</dd>
                <dt>Capacidade</dt><dd>{aeronave.capacidade}</dd>
                <dt>Alcance</dt><dd>{aeronave.alcance} km</dd>
                <dt>Descrição</dt><dd>{aeronave.descricao || "—"}</dd>
              </dl>
              <hr className="hr" style={{ margin: "18px 0" }} />
              <div className="section-h">
                <h3>Peças ({aeronave.pecas.length})</h3>
                {gerir && (
                  <button type="button" className="btn btn-sm" onClick={() => setOpenAddPeca(true)}>
                    <Icon name="plus" size={12} />Adicionar
                  </button>
                )}
              </div>
              <div className="list">
                {aeronave.pecas.length === 0 ? (
                  <div className="muted" style={{ fontSize: 13 }}>Sem peças vinculadas.</div>
                ) : (
                  aeronave.pecas.map((p) => (
                    <div className="row-card" key={p.id}>
                      <div className="meta">
                        <div className="row-title">{p.nome}</div>
                        <div className="row-sub">{TIPO_PECA_LABEL[p.tipo]} · {p.fornecedor}</div>
                      </div>
                      <div className="row-actions">
                        <StatusPill value={p.status} label={STATUS_PECA_LABEL[p.status]} />
                        {gerir && (
                          <button type="button" className="icon-btn" onClick={() => removePeca(p.id)}>
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="section-h">
                <h3>Etapas ({aeronave.etapas.length})</h3>
                {gerir && (
                  <button type="button" className="btn btn-sm" onClick={() => setOpenAddEtapa(true)}>
                    <Icon name="plus" size={12} />Adicionar etapa
                  </button>
                )}
              </div>
              <div className="list">
                {aeronave.etapas.map((e) => {
                  const bloqueio = bloqueioDe(e, aeronave.etapas);
                  const processando = processandoId === e.id;
                  return (
                    <div className="row-card" key={e.id}>
                      <div className="meta">
                        <div className="row-title">{e.nome}</div>
                        <div className="row-sub">
                          Prazo: {fmtDate(e.prazo)} · {e.responsaveis.length} resp.
                          {bloqueio && (
                            <span className="muted">
                              {" · "}
                              {bloqueio.tipo === "iniciar"
                                ? `aguardando "${bloqueio.bloqueadora.nome}"`
                                : `aguardando conclusão de "${bloqueio.bloqueadora.nome}"`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="row-actions">
                        <StatusPill value={e.status} label={STATUS_ETAPA_LABEL[e.status]} />
                        {operar && (
                          <button
                            type="button"
                            className={cls("btn btn-sm", bloqueio && "btn-blocked")}
                            disabled={processando}
                            aria-disabled={!!bloqueio}
                            title={
                              bloqueio
                                ? "Saiba por que esta ação está indisponível"
                                : e.status === "PENDENTE"
                                ? "Iniciar"
                                : e.status === "ANDAMENTO"
                                ? "Encerrar"
                                : "Reabrir"
                            }
                            onClick={() => acionarEtapa(e)}
                          >
                            <Icon name={e.status === "ANDAMENTO" ? "stop" : "play"} size={12} />
                            {processando
                              ? "Aguarde…"
                              : e.status === "PENDENTE"
                              ? "Iniciar"
                              : e.status === "ANDAMENTO"
                              ? "Encerrar"
                              : "Reabrir"}
                          </button>
                        )}
                        <button type="button" className="btn btn-sm" onClick={() => setOpenEtapa(e.id)}>
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr className="hr" style={{ margin: "18px 0" }} />
              <div className="section-h">
                <h3>Testes ({aeronave.testes.length})</h3>
                {gerir && (
                  <button type="button" className="btn btn-sm" onClick={() => setOpenAddTeste(true)}>
                    <Icon name="plus" size={12} />Registrar teste
                  </button>
                )}
              </div>
              <div className="list">
                {aeronave.testes.length === 0 ? (
                  <div className="muted" style={{ fontSize: 13 }}>Nenhum teste registrado.</div>
                ) : (
                  aeronave.testes.map((t) => (
                    <div className="row-card" key={t.id}>
                      <div className="meta">
                        <div className="row-title">{TIPO_TESTE_LABEL[t.tipo]}</div>
                      </div>
                      <div className="row-actions">
                        <StatusPill value={t.resultado} label={RESULTADO_LABEL[t.resultado]} />
                        {gerir && (
                          <button type="button" className="icon-btn" onClick={() => removeTeste(t.id)}>
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-primary" onClick={() => setOpenRelatorio(true)}>
            <Icon name="check" size={14} />Gerar relatório
          </button>
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>

      {etapaAberta && (
        <EtapaDetail
          etapa={etapaAberta}
          etapas={aeronave.etapas}
          allFunc={allFunc}
          perfil={perfil}
          reload={reload}
          pushToast={pushToast}
          onClose={() => setOpenEtapa(null)}
        />
      )}
      {bloqueioInfo && (
        <BloqueioEtapaModal
          etapa={bloqueioInfo.etapa}
          bloqueio={bloqueioInfo.bloqueio}
          onVerBloqueadora={() => {
            setOpenEtapa(bloqueioInfo.bloqueio.bloqueadora.id);
            setBloqueioInfo(null);
          }}
          onClose={() => setBloqueioInfo(null)}
        />
      )}
      {openAddEtapa && <AddEtapa onClose={() => setOpenAddEtapa(false)} onAdd={addEtapa} />}
      {openAddPeca && (
        <AddPecaToAeronave
          onClose={() => setOpenAddPeca(false)}
          available={allPecas.filter((p) => !aeronave.pecas.some((ap) => ap.id === p.id))}
          onAdd={addPeca}
        />
      )}
      {openAddTeste && <AddTeste onClose={() => setOpenAddTeste(false)} onAdd={addTeste} />}
      {openRelatorio && (
        <RelatorioModal
          codigo={aeronave.codigo}
          pushToast={pushToast}
          onClose={() => setOpenRelatorio(false)}
        />
      )}
    </div>
  );
}

interface EtapaDetailProps {
  etapa: Etapa;
  etapas: Etapa[];
  allFunc: Funcionario[];
  perfil: NivelPermissao;
  reload: () => Promise<void>;
  pushToast: (msg: string) => void;
  onClose: () => void;
}

function EtapaDetail({ etapa, etapas, allFunc, perfil, reload, pushToast, onClose }: EtapaDetailProps) {
  const [showAddResp, setShowAddResp] = useState(false);
  const [showBloqueio, setShowBloqueio] = useState(false);
  const [processando, setProcessando] = useState(false);
  const gerir = podeGerir(perfil);
  const operar = podeOperar(perfil);
  const bloqueio = bloqueioDe(etapa, etapas);

  const removeResp = async (id: string) => {
    try {
      await api.removerResponsavel(etapa.id, id);
      await reload();
      pushToast("Responsável removido.");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao remover responsável.");
    }
  };
  const addResp = async (id: string, nome: string) => {
    try {
      await api.associarResponsavel(etapa.id, id);
      await reload();
      setShowAddResp(false);
      pushToast(`${nome} foi atribuído.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao atribuir responsável.");
    }
  };
  const toggle = async () => {
    if (bloqueio) {
      setShowBloqueio(true);
      return;
    }
    if (processando) return;
    setProcessando(true);
    try {
      await api.alterarStatusEtapa(etapa.id, acaoPara(etapa.status));
      await reload();
      pushToast(`Etapa "${etapa.nome}" atualizada.`);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Erro ao mudar status.");
    } finally {
      setProcessando(false);
    }
  };

  const d = daysUntil(etapa.prazo);
  const disponiveis = allFunc.filter((f) => !etapa.responsaveis.some((r) => r.id === f.id));

  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 100 }}>
      <div className="modal md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Etapa · {etapa.id}</div>
            <h2>{etapa.nome}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div>
            <div className="section-h">
              <h3>Detalhes</h3>
              <StatusPill value={etapa.status} label={STATUS_ETAPA_LABEL[etapa.status]} />
            </div>
            <dl className="kv">
              <dt>Prazo</dt>
              <dd>
                {fmtDate(etapa.prazo)}
                {etapa.status !== "CONCLUIDA" && (
                  <span className="muted">
                    {" · "}
                    {d < 0 ? `${-d}d em atraso` : d === 0 ? "Vence hoje" : `Em ${d}d`}
                  </span>
                )}
              </dd>
              <dt>Descrição</dt><dd>{etapa.descricao || "—"}</dd>
            </dl>
          </div>
          <div>
            <div className="section-h">
              <h3>Responsáveis ({etapa.responsaveis.length})</h3>
              {gerir && (
                <button type="button" className="btn btn-sm" onClick={() => setShowAddResp(true)}>
                  <Icon name="plus" size={12} />Adicionar
                </button>
              )}
            </div>
            {etapa.responsaveis.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>Sem responsáveis atribuídos.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {etapa.responsaveis.map((r) => (
                  <span className="responsavel" key={r.id}>
                    <span className="av">{initials(r.nome)}</span>
                    {r.nome}
                    {gerir && (
                      <button type="button" className="x" onClick={() => removeResp(r.id)} title="Remover">
                        <Icon name="close" size={10} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          {bloqueio && (
            <button
              type="button"
              className="btn-link-info"
              style={{ marginRight: "auto" }}
              onClick={() => setShowBloqueio(true)}
            >
              <Icon name="info" size={14} />
              {bloqueio.tipo === "iniciar"
                ? "Por que não posso iniciar?"
                : "Por que não posso finalizar?"}
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
          {operar && (
            <button
              type="button"
              className={cls("btn btn-primary", bloqueio && "btn-blocked")}
              onClick={toggle}
              disabled={processando}
              aria-disabled={!!bloqueio}
              title={bloqueio ? "Saiba por que esta ação está indisponível" : undefined}
            >
              <Icon name={etapa.status === "ANDAMENTO" ? "stop" : "play"} size={14} />
              {processando
                ? "Aguarde…"
                : etapa.status === "PENDENTE"
                ? "Iniciar etapa"
                : etapa.status === "ANDAMENTO"
                ? "Finalizar etapa"
                : "Reabrir etapa"}
            </button>
          )}
        </div>
      </div>

      {showBloqueio && bloqueio && (
        <BloqueioEtapaModal
          etapa={etapa}
          bloqueio={bloqueio}
          onClose={() => setShowBloqueio(false)}
        />
      )}

      {showAddResp && (
        <div className="scrim" onClick={() => setShowAddResp(false)} style={{ paddingTop: 140 }}>
          <div className="modal sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Adicionar responsável</h2>
              <button type="button" className="icon-btn" onClick={() => setShowAddResp(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="modal-body">
              <div className="list">
                {disponiveis.map((f) => (
                  <button
                    type="button"
                    className="row-card"
                    key={f.id}
                    onClick={() => addResp(f.id, f.nome)}
                  >
                    <div className="meta" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <div className="responsavel" style={{ padding: 0, border: 0, background: "transparent" }}>
                        <span className="av">{initials(f.nome)}</span>
                      </div>
                      <div>
                        <div className="row-title">{f.nome}</div>
                        <div className="row-sub">{NIVEL_LABEL[f.nivelPermissao]} · {f.usuario}</div>
                      </div>
                    </div>
                    <Icon name="plus" size={14} />
                  </button>
                ))}
                {disponiveis.length === 0 && (
                  <div className="muted" style={{ fontSize: 13 }}>
                    Todos os funcionários já estão atribuídos.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BloqueioEtapaModalProps {
  etapa: Etapa;
  bloqueio: Bloqueio;
  onVerBloqueadora?: () => void;
  onClose: () => void;
}

function BloqueioEtapaModal({ etapa, bloqueio, onVerBloqueadora, onClose }: BloqueioEtapaModalProps) {
  const iniciar = bloqueio.tipo === "iniciar";
  const titulo = iniciar ? "Não é possível iniciar agora" : "Não é possível finalizar agora";

  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 160 }}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Etapa · {etapa.nome}</div>
            <h2>{titulo}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="callout">
            <span className="callout-icon"><Icon name="info" size={18} /></span>
            <div>
              {iniciar ? (
                <>
                  Cada aeronave executa <b>uma etapa por vez</b>, seguindo a ordem de produção.
                  A etapa <b>&quot;{bloqueio.bloqueadora.nome}&quot;</b> ainda está em andamento, então
                  <b> &quot;{etapa.nome}&quot;</b> só poderá começar depois que ela for concluída.
                </>
              ) : (
                <>
                  As etapas são concluídas <b>na ordem de produção</b>. A etapa anterior
                  <b> &quot;{bloqueio.bloqueadora.nome}&quot;</b> ainda não foi concluída, então
                  <b> &quot;{etapa.nome}&quot;</b> não pode ser finalizada antes dela.
                </>
              )}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {onVerBloqueadora && (
            <button type="button" className="btn" style={{ marginRight: "auto" }} onClick={onVerBloqueadora}>
              <Icon name="arrow" size={14} />
              Ir para &quot;{bloqueio.bloqueadora.nome}&quot;
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>Entendi</button>
        </div>
      </div>
    </div>
  );
}

interface AddEtapaProps {
  onClose: () => void;
  onAdd: (e: { nome: string; prazo: string; descricao?: string }) => void;
}

function AddEtapa({ onClose, onAdd }: AddEtapaProps) {
  const [form, setForm] = useState({ nome: "", prazo: "", descr: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.prazo) return;
    onAdd({ nome: form.nome, prazo: form.prazo, descricao: form.descr || undefined });
  };

  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 80 }}>
      <form className="modal md" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>Nova etapa</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid one">
            <div className="field">
              <label>Nome da etapa</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Montagem de fuselagem traseira"
                required
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Prazo</label>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Status inicial</label>
                <select disabled value="PENDENTE">
                  <option value="PENDENTE">Pendente</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Descrição</label>
              <textarea
                value={form.descr}
                onChange={(e) => setForm({ ...form, descr: e.target.value })}
                placeholder="Descreva o escopo da etapa…"
              />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            <Icon name="plus" />Criar etapa
          </button>
        </div>
      </form>
    </div>
  );
}

interface AddPecaToAeronaveProps {
  onClose: () => void;
  available: Peca[];
  onAdd: (id: string) => void;
}

function AddPecaToAeronave({ onClose, available, onAdd }: AddPecaToAeronaveProps) {
  const [q, setQ] = useState("");
  const list = available.filter((p) =>
    `${p.id} ${p.nome} ${TIPO_PECA_LABEL[p.tipo]} ${p.fornecedor}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 90 }}>
      <div className="modal cmp" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Vincular peça</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 10 }}>
            <Icon name="search" />
            <input placeholder="Buscar peça…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="list">
            {list.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>Nenhuma peça disponível.</div>
            ) : (
              list.map((p) => (
                <button type="button" className="row-card" key={p.id} onClick={() => onAdd(p.id)}>
                  <div className="meta">
                    <div className="row-title">{p.nome}</div>
                    <div className="row-sub">{TIPO_PECA_LABEL[p.tipo]} · {p.fornecedor}</div>
                  </div>
                  <div className="row-actions">
                    <StatusPill value={p.status} label={STATUS_PECA_LABEL[p.status]} />
                    <Icon name="plus" size={14} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddTesteProps {
  onClose: () => void;
  onAdd: (tipo: TipoTeste, resultado: ResultadoTeste) => void;
}

function AddTeste({ onClose, onAdd }: AddTesteProps) {
  const [tipo, setTipo] = useState<TipoTeste>("ELETRICO");
  const [resultado, setResultado] = useState<ResultadoTeste>("APROVADO");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(tipo, resultado);
  };
  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 90 }}>
      <form className="modal sm" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>Registrar teste</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid one">
            <div className="field">
              <label>Tipo de teste</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoTeste)}>
                {opcoes(TIPO_TESTE_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Resultado</label>
              <select value={resultado} onChange={(e) => setResultado(e.target.value as ResultadoTeste)}>
                {opcoes(RESULTADO_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary"><Icon name="plus" />Registrar</button>
        </div>
      </form>
    </div>
  );
}

interface RelatorioModalProps {
  codigo: string;
  pushToast: (msg: string) => void;
  onClose: () => void;
}

function RelatorioModal({ codigo, pushToast, onClose }: RelatorioModalProps) {
  const [nomeCliente, setNomeCliente] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [texto, setTexto] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const gerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente || !dataEntrega) return;
    setGerando(true);
    try {
      const res = await api.gerarRelatorio(codigo, nomeCliente, dataEntrega);
      setTexto(res.texto);
      pushToast(`Relatório salvo: ${res.arquivo}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erro ao gerar relatório.");
    } finally {
      setGerando(false);
    }
  };

  const baixar = () => {
    if (!texto) return;
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${codigo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scrim" onClick={onClose} style={{ paddingTop: 70 }}>
      <div className="modal md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Relatório de entrega</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {!texto ? (
            <form className="form-grid one" onSubmit={gerar}>
              <div className="field">
                <label>Nome do cliente</label>
                <input
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Ex.: Embraer"
                  required
                />
              </div>
              <div className="field">
                <label>Data de entrega</label>
                <input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={gerando}>
                {gerando ? "Gerando…" : "Gerar relatório"}
              </button>
            </form>
          ) : (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "var(--mono, monospace)",
                fontSize: 12.5,
                lineHeight: 1.5,
                background: "var(--surface-2, rgba(127,127,127,.08))",
                padding: 14,
                borderRadius: 8,
                maxHeight: 360,
                overflow: "auto",
              }}
            >
              {texto}
            </pre>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
          {texto && (
            <button type="button" className="btn btn-primary" onClick={baixar}>
              <Icon name="check" size={14} />Baixar .txt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CadastrarAeronaveProps {
  onClose: () => void;
  onCreate: (a: api.NovaAeronave) => void;
}

function CadastrarAeronave({ onClose, onCreate }: CadastrarAeronaveProps) {
  const [f, setF] = useState({
    codigo: "",
    modelo: "",
    tipo: "COMERCIAL" as TipoAeronave,
    capacidade: "",
    alcance: "",
    descricao: "",
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.codigo || !f.modelo) return;
    onCreate({
      codigo: f.codigo,
      modelo: f.modelo,
      tipo: f.tipo,
      capacidade: Number(f.capacidade) || 0,
      alcance: Number(f.alcance) || 0,
      descricao: f.descricao || undefined,
    });
  };

  return (
    <div className="scrim" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>Cadastrar aeronave</h2>
          <button type="button" className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>Código</label>
              <input
                value={f.codigo}
                onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })}
                placeholder="AC-XX"
                required
              />
            </div>
            <div className="field">
              <label>Nome / Modelo</label>
              <input
                value={f.modelo}
                onChange={(e) => setF({ ...f, modelo: e.target.value })}
                placeholder="Ex.: Pelicano"
                required
              />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoAeronave })}>
                {opcoes(TIPO_AERONAVE_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Capacidade</label>
              <input
                type="number"
                min="0"
                value={f.capacidade}
                onChange={(e) => setF({ ...f, capacidade: e.target.value })}
                placeholder="Ex.: 78"
              />
            </div>
            <div className="field">
              <label>Alcance (km)</label>
              <input
                type="number"
                min="0"
                value={f.alcance}
                onChange={(e) => setF({ ...f, alcance: e.target.value })}
                placeholder="Ex.: 3100"
              />
            </div>
            <div className="field field-full">
              <label>Descrição</label>
              <textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            <Icon name="plus" />Cadastrar
          </button>
        </div>
      </form>
    </div>
  );
}
