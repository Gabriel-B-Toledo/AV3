"use client";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import { daysUntil } from "../lib/helpers";
import { STATUS_ETAPA_LABEL } from "../lib/labels";
import type { DataState, Route, Usuario } from "../lib/types";

interface HomeProps {
  data: DataState;
  onNav: (r: Route) => void;
  user: Usuario | { nome: string };
}

export function Home({ data, onNav, user }: HomeProps) {
  const ativas = data.aeronaves.reduce(
    (a, b) => a + b.etapas.filter((e) => e.status === "ANDAMENTO").length,
    0,
  );
  const proximas = data.aeronaves
    .flatMap((a) =>
      a.etapas
        .filter((e) => e.status !== "CONCLUIDA")
        .map((e) => ({ ...e, aeronave: `${a.codigo} ${a.modelo}` })),
    )
    .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
    .slice(0, 4);

  const today = new Date();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Bem-vindo, {user.nome.split(" ")[0]}.</h1>
          <div className="sub">
            Aqui está um resumo do que está em produção hoje,{" "}
            {today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}.
          </div>
        </div>
      </div>
      <div className="home-grid">
        <div className="stat">
          <div className="label">Aeronaves em produção</div>
          <div className="value">{data.aeronaves.length}</div>
          <div className="delta">{ativas} etapas em andamento</div>
        </div>
        <div className="stat">
          <div className="label">Peças catalogadas</div>
          <div className="value">{data.pecas.length}</div>
          <div className="delta">
            {data.pecas.filter((p) => p.status === "PRONTA").length} prontas
          </div>
        </div>
        <div className="stat">
          <div className="label">Funcionários ativos</div>
          <div className="value">{data.funcionarios.length}</div>
          <div className="delta">
            {data.funcionarios.filter((f) => f.processos.length > 0).length} alocados
          </div>
        </div>
      </div>

      <div className="home-cards">
        <div className="panel">
          <h3>Acessos rápidos</h3>
          <button type="button" className="nav-tile" onClick={() => onNav("aeronaves")}>
            <div className="nt-l">
              <div className="nt-icon"><Icon name="plane" /></div>
              <div>
                <div className="nt-title">Aeronaves</div>
                <div className="nt-sub">Gerencie etapas, peças e testes de cada aeronave em produção.</div>
              </div>
            </div>
            <Icon name="arrow" />
          </button>
          <button type="button" className="nav-tile" onClick={() => onNav("pecas")}>
            <div className="nt-l">
              <div className="nt-icon"><Icon name="box" /></div>
              <div>
                <div className="nt-title">Peças</div>
                <div className="nt-sub">Catálogo de componentes, fornecedores e disponibilidade.</div>
              </div>
            </div>
            <Icon name="arrow" />
          </button>
          <button type="button" className="nav-tile" onClick={() => onNav("funcionarios")}>
            <div className="nt-l">
              <div className="nt-icon"><Icon name="users" /></div>
              <div>
                <div className="nt-title">Funcionários</div>
                <div className="nt-sub">Equipe técnica, permissões e processos em andamento.</div>
              </div>
            </div>
            <Icon name="arrow" />
          </button>
        </div>
        <div className="panel">
          <h3>Próximas etapas</h3>
          {proximas.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>Nenhuma etapa pendente.</div>
          ) : (
            <div className="list">
              {proximas.map((e) => {
                const days = daysUntil(e.prazo);
                return (
                  <div key={e.id} className="row-card" style={{ padding: "10px 12px" }}>
                    <div className="meta">
                      <div className="row-title">{e.nome}</div>
                      <div className="row-sub">
                        {e.aeronave} ·{" "}
                        {days < 0 ? `${-days}d em atraso` : days === 0 ? "Vence hoje" : `Em ${days}d`}
                      </div>
                    </div>
                    <StatusPill value={e.status} label={STATUS_ETAPA_LABEL[e.status]} />
                  </div>
                );
              })}
            </div>
          )}
          <hr className="hr" style={{ margin: "14px 0" }} />
          <h3 style={{ marginTop: 0 }}>Sobre o Aerocode</h3>
          <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
            Plataforma interna para acompanhamento da linha de produção de aeronaves - etapas, peças,
            testes e equipes em um só lugar.
          </div>
        </div>
      </div>
    </div>
  );
}
