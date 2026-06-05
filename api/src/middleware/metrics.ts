import type { Request, Response, NextFunction } from "express";

// Mede o tempo de processamento do servidor (do início do handler até o envio
// da resposta) e o expõe em headers. Isso permite ao cliente separar o tempo
// de resposta total da latência de rede — base para o relatório de qualidade
// exigido na AV3 (latência, tempo de resposta e tempo de processamento).
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
