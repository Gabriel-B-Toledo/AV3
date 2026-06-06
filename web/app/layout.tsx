import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aerocode - Gestão de Produção de Aeronaves",
  description:
    "Plataforma interna para acompanhamento da linha de produção de aeronaves - etapas, peças, testes e equipes em um só lugar.",
};

const noFlashTheme = `(function(){try{var v=localStorage.getItem('aerocode-theme-v2');if(v!=='light'&&v!=='dark')v='dark';document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}