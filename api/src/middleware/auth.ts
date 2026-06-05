import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { NivelPermissao } from "@prisma/client";
import { env } from "../env";
import { AppError } from "../http";

export interface AuthPayload {
  sub: string; // id do funcionário
  usuario: string;
  nome: string;
  nivel: NivelPermissao;
}

// Disponibiliza req.user de forma tipada em toda a aplicação.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Exige um token JWT válido no header Authorization: Bearer <token>.
export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Autenticação necessária.");
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    req.user = jwt.verify(token, env.jwtSecret) as AuthPayload;
    next();
  } catch {
    throw new AppError(401, "Token inválido ou expirado.");
  }
}

// Restringe a rota aos níveis de permissão informados (autorização da AV1).
export function exigirNivel(...niveis: NivelPermissao[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, "Autenticação necessária.");
    if (!niveis.includes(req.user.nivel)) {
      throw new AppError(403, "Você não tem permissão para executar esta ação.");
    }
    next();
  };
}
