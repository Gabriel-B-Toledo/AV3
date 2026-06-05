import type { Request, Response, NextFunction } from "express";

export function metrics(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  const marcar = () => {
    if (res.headersSent) return;
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    res.setHeader("Server-Timing", `app;desc="processamento";dur=${durMs.toFixed(3)}`);
    res.setHeader("X-Processing-Time-Ms", durMs.toFixed(3));
  };

  const origJson = res.json.bind(res);
  res.json = (body: unknown) => {
    marcar();
    return origJson(body);
  };

  const origSend = res.send.bind(res);
  res.send = (body: unknown) => {
    marcar();
    return origSend(body);
  };

  next();
}
