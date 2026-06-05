"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
const THEME_KEY = "aerocode-theme-v2";

function lerTema(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function inscrever(callback: () => void): () => void {
  window.addEventListener("aerocode:theme", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("aerocode:theme", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(inscrever, lerTema, (): Theme => "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    const proximo: Theme = lerTema() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, proximo);
    } catch {}
    window.dispatchEvent(new Event("aerocode:theme"));
  }, []);

  return [theme, toggle];
}
