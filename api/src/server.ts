import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "./env";
import { AppError } from "./http";
import { metrics } from "./middleware/metrics";
import authRoutes from "./routes/authRoutes";
import aeronaveRoutes from "./routes/aeronaveRoutes";
import pecaRoutes from "./routes/pecaRoutes";
import funcionarioRoutes from "./routes/funcionarioRoutes";
import etapaRoutes from "./routes/etapaRoutes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    exposedHeaders: ["Server-Timing", "X-Processing-Time-Ms"],
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(metrics);

app.get("/api/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/api/auth", authRoutes);
app.use("/api/aeronaves", aeronaveRoutes);
app.use("/api/pecas", pecaRoutes);
app.use("/api/funcionarios", funcionarioRoutes);
app.use("/api/etapas", etapaRoutes);

app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Dados inválidos.", detalhes: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Registro duplicado." });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Registro não encontrado." });
      return;
    }
  }
  console.error("[erro não tratado]", err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(env.port, () => {
  console.log(`API rodando em http://localhost:${env.port}`);
});
