import type { Request, Response, NextFunction } from "express";

// Erro de aplicação com código HTTP associado. Lançado pelos services e
// traduzido em resposta JSON pelo error handler global.
export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// Envolve handlers assíncronos para encaminhar rejeições ao error handler.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
