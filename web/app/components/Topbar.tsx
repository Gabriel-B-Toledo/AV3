"use client";
import { Icon } from "./Icon";
import { cls, initials } from "../lib/helpers";
import type { Usuario, Route } from "../lib/types";
import type { Theme } from "../hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label="Alternar tema"
      type="button"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

interface TopbarProps {
  mode: "login" | "app";
  user?: Usuario | { nome: string };
  route?: Route;
  onNav?: (r: Route) => void;
  onLogout?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Topbar({ mode, user, route, onNav, onLogout, theme, onToggleTheme }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="plane" size={14} />
        </span>
        Aerocode
      </div>
      {mode === "app" && onNav && (
        <div className="topnav">
          <button type="button" className={cls(route === "home" && "active")} onClick={() => onNav("home")}>Início</button>
          <button type="button" className={cls(route === "aeronaves" && "active")} onClick={() => onNav("aeronaves")}>Aeronaves</button>
          <button type="button" className={cls(route === "pecas" && "active")} onClick={() => onNav("pecas")}>Peças</button>
          <button type="button" className={cls(route === "funcionarios" && "active")} onClick={() => onNav("funcionarios")}>Funcionários</button>
        </div>
      )}
      <div className="spacer" />
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      {mode === "login" || !user ? (
        <div className="user">
          <span style={{ opacity: 0.7, fontSize: 13 }}>Login / Cadastro</span>
        </div>
      ) : (
        <div className="user">
          <div className="avatar">{initials(user.nome)}</div>
          <span className="user-name">{user.nome}</span>
          <button type="button" className="logout" onClick={onLogout}>Sair</button>
        </div>
      )}
    </div>
  );
}
