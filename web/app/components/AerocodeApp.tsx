"use client";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import * as api from "../lib/api";
import type { DataState, Route, Toast, Usuario } from "../lib/types";
import { Topbar } from "./Topbar";
import { Login } from "./Login";
import { Home } from "./Home";
import { Aeronaves } from "./Aeronaves";
import { Pecas } from "./Pecas";
import { Funcionarios } from "./Funcionarios";
import { ToastStack } from "./ToastStack";

const VAZIO: DataState = { funcionarios: [], pecas: [], aeronaves: [] };

export function AerocodeApp() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [route, setRoute] = useState<Route>("home");
  const [data, setData] = useState<DataState>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, toggleTheme] = useTheme();

  // Restaura a sessão salva (token + usuário) ao montar.
  useEffect(() => {
    const salvo = api.getUsuarioSalvo();
    if (salvo) setUser(salvo);
  }, []);

  // Sessão expirada/inválida (401): volta para a tela de login.
  useEffect(() => {
    const onUnauth = () => {
      setUser(null);
      setData(VAZIO);
    };
    window.addEventListener("aerocode:unauthorized", onUnauth);
    return () => window.removeEventListener("aerocode:unauthorized", onUnauth);
  }, []);

  const pushToast = useCallback((msg: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const reload = useCallback(async () => {
    setErro(null);
    try {
      setData(await api.fetchAll());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar os dados.");
    }
  }, []);

  // Carrega os dados sempre que houver um usuário autenticado.
  useEffect(() => {
    if (user) void reload();
  }, [user, reload]);

  const handleLogin = (u: Usuario) => {
    setUser(u);
    setRoute("home");
  };
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setData(VAZIO);
    setRoute("home");
  };

  if (!user) {
    return (
      <>
        <Topbar mode="login" theme={theme} onToggleTheme={toggleTheme} />
        <Login onLogin={handleLogin} pushToast={pushToast} />
      </>
    );
  }

  const common = { data, reload, pushToast, perfil: user.nivelPermissao };

  return (
    <>
      <Topbar
        mode="app"
        user={user}
        route={route}
        onNav={setRoute}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {erro && (
        <div className="page">
          <div className="row-card" style={{ borderColor: "var(--danger)" }}>
            <div className="meta">
              <div className="row-title">Não foi possível conectar à API</div>
              <div className="row-sub">{erro}</div>
            </div>
            <button type="button" className="btn btn-sm" onClick={() => void reload()}>
              Tentar novamente
            </button>
          </div>
        </div>
      )}
      {route === "home" && <Home data={data} onNav={setRoute} user={user} />}
      {route === "aeronaves" && <Aeronaves {...common} />}
      {route === "pecas" && <Pecas {...common} />}
      {route === "funcionarios" && <Funcionarios {...common} />}
      <ToastStack toasts={toasts} />
    </>
  );
}
