"use client";
import { useState } from "react";
import { Icon } from "./Icon";
import * as api from "../lib/api";
import type { Usuario } from "../lib/types";

interface LoginProps {
  onLogin: (user: Usuario) => void;
  pushToast: (msg: string) => void;
}

const USUARIOS_DEMO = [
  { usuario: "admin", papel: "Administrador" },
  { usuario: "engineer", papel: "Engenheiro" },
  { usuario: "operator", papel: "Operador" },
];

export function Login({ onLogin, pushToast }: LoginProps) {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("123456");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const usuario = await api.login(u.trim(), p);
      pushToast(`Bem-vindo, ${usuario.nome.split(" ")[0]}.`);
      onLogin(usuario);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao entrar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-pitch">
        <div className="pre">Gestão de produção</div>
        <h1>Aeronaves prontas no prazo, peça por peça.</h1>
        <p>Acompanhe etapas, peças e equipes em um só painel — do projeto ao voo de homologação.</p>
        <div className="login-feats">
          <div><Icon name="check" /> Linha de montagem em tempo real</div>
          <div><Icon name="check" /> Inventário de peças e fornecedores</div>
          <div><Icon name="check" /> Atribuição de equipes por etapa</div>
          <div><Icon name="check" /> Histórico de testes e homologações</div>
        </div>
      </div>
      <div className="login-card-wrap">
        <form className="login-card" onSubmit={submit}>
          <h2>Entrar no Aerocode</h2>
          <div className="lc-sub">Acesse com seu usuário corporativo.</div>
          <div className="field">
            <label>Usuário</label>
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder="seu.usuario" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="lc-forgot">
            <button type="button" className="btn-link-info" onClick={() => setShowSenha(true)}>
              Esqueci minha senha
            </button>
          </div>
          {erro && (
            <div className="help err" style={{ marginBottom: 10 }}>
              {erro}
            </div>
          )}
          <button className="login-btn" type="submit" disabled={carregando}>
            {carregando ? "Entrando…" : "Acessar"}
          </button>
        </form>
      </div>

      {showSenha && (
        <div className="scrim" onClick={() => setShowSenha(false)}>
          <div className="modal sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Acesso de demonstração</div>
                <h2>Esqueci minha senha</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowSenha(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="modal-body">
              <div className="callout">
                <span className="callout-icon"><Icon name="info" size={18} /></span>
                <div>
                  Este é um ambiente de demonstração. A senha é <b>123456</b> para todos os
                  usuários abaixo.
                </div>
              </div>
              <div className="list">
                {USUARIOS_DEMO.map((d) => (
                  <button
                    type="button"
                    className="row-card"
                    key={d.usuario}
                    onClick={() => {
                      setU(d.usuario);
                      setP("123456");
                      setShowSenha(false);
                    }}
                  >
                    <div className="meta">
                      <div className="row-title">{d.usuario}</div>
                      <div className="row-sub">{d.papel}</div>
                    </div>
                    <span className="mono">123456</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-primary" onClick={() => setShowSenha(false)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
