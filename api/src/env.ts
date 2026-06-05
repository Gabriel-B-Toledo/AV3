import dotenv from "dotenv";
import path from "path";

// Carrega o .env localizado na raiz do back-end (funciona tanto rodando de
// src/ via tsx quanto de dist/ após o build).
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-inseguro-troque-me",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
};

if (!process.env.JWT_SECRET) {
  console.warn(
    "[aviso] JWT_SECRET não definido no .env — usando segredo de desenvolvimento.",
  );
}
