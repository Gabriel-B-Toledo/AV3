import fs from "fs";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

const FONT_CANDIDATES = [
  "C:\\Windows\\Fonts\\segoeui.ttf",
  "C:\\Windows\\Fonts\\arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
];

let FAMILY = "sans-serif";
for (const p of FONT_CANDIDATES) {
  if (fs.existsSync(p)) {
    try {
      GlobalFonts.registerFromPath(p, "BenchFont");
      FAMILY = "BenchFont";
      break;
    } catch {
      // tenta o próximo candidato
    }
  }
}

export interface BarChartOptions {
  titulo: string;
  categorias: string[];
  valores: number[];
  unidade: string;
  cor: string;
  arquivo: string;
}

function escalaAgradavel(max: number): { topo: number; passo: number } {
  if (max <= 0) return { topo: 1, passo: 0.2 };
  const bruto = max / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const norm = bruto / mag;
  const passoNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const passo = passoNorm * mag;
  return { topo: passo * Math.ceil(max / passo), passo };
}

export function renderBarChart(opts: BarChartOptions): void {
  const W = 840;
  const H = 500;
  const margem = { topo: 74, baixo: 78, esq: 84, dir: 36 };
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#0f1623";
  ctx.font = `bold 22px ${FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.titulo, W / 2, 30);

  const plot = {
    x0: margem.esq,
    y0: margem.topo,
    x1: W - margem.dir,
    y1: H - margem.baixo,
  };
  const plotW = plot.x1 - plot.x0;
  const plotH = plot.y1 - plot.y0;

  const maxValor = Math.max(...opts.valores, 0);
  const { topo, passo } = escalaAgradavel(maxValor);

  ctx.strokeStyle = "#e6e9ef";
  ctx.fillStyle = "#5b6473";
  ctx.lineWidth = 1;
  ctx.font = `13px ${FAMILY}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let v = 0; v <= topo + 1e-9; v += passo) {
    const y = plot.y1 - (v / topo) * plotH;
    ctx.beginPath();
    ctx.moveTo(plot.x0, y);
    ctx.lineTo(plot.x1, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(v < 10 ? 1 : 0), plot.x0 - 10, y);
  }

  ctx.save();
  ctx.translate(22, (plot.y0 + plot.y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#0f1623";
  ctx.font = `14px ${FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.unidade, 0, 0);
  ctx.restore();

  ctx.strokeStyle = "#9aa3b2";
  ctx.beginPath();
  ctx.moveTo(plot.x0, plot.y0);
  ctx.lineTo(plot.x0, plot.y1);
  ctx.lineTo(plot.x1, plot.y1);
  ctx.stroke();

  const n = opts.categorias.length;
  const slot = plotW / n;
  const larguraBarra = slot * 0.5;
  for (let i = 0; i < n; i++) {
    const cx = plot.x0 + slot * (i + 0.5);
    const valor = opts.valores[i] ?? 0;
    const altura = topo > 0 ? (valor / topo) * plotH : 0;
    const x = cx - larguraBarra / 2;
    const y = plot.y1 - altura;

    ctx.fillStyle = opts.cor;
    ctx.fillRect(x, y, larguraBarra, altura);

    ctx.fillStyle = "#0f1623";
    ctx.font = `bold 14px ${FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${valor.toFixed(2)} ${opts.unidade}`, cx, y - 6);

    ctx.fillStyle = "#3a4150";
    ctx.font = `14px ${FAMILY}`;
    ctx.textBaseline = "top";
    ctx.fillText(opts.categorias[i], cx, plot.y1 + 10);
  }

  fs.writeFileSync(opts.arquivo, canvas.toBuffer("image/png"));
}
