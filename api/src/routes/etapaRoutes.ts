import { Router } from "express";
import { z } from "zod";
import { NivelPermissao } from "@prisma/client";
import { asyncHandler } from "../http";
import { autenticar, exigirNivel } from "../middleware/auth";
import * as etapaService from "../services/etapaService";

const router = Router();
const GESTAO = [NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO] as const;
const COM_OPERADOR = [...GESTAO, NivelPermissao.OPERADOR] as const;

router.use(autenticar);

const statusSchema = z.object({ acao: z.enum(["iniciar", "finalizar", "reabrir"]) });

// Operador também pode movimentar etapas (chão de fábrica).
router.patch(
  "/:id/status",
  exigirNivel(...COM_OPERADOR),
  asyncHandler(async (req, res) => {
    const { acao } = statusSchema.parse(req.body);
    await etapaService.alterarStatus(req.params.id, acao);
    res.json({ ok: true });
  }),
);

const responsavelSchema = z.object({ funcionarioId: z.string().min(1) });

router.post(
  "/:id/responsaveis",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const { funcionarioId } = responsavelSchema.parse(req.body);
    await etapaService.associarResponsavel(req.params.id, funcionarioId);
    res.status(201).json({ ok: true });
  }),
);

router.delete(
  "/:id/responsaveis/:funcId",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    await etapaService.removerResponsavel(req.params.id, req.params.funcId);
    res.status(204).end();
  }),
);

router.delete(
  "/:id",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    await etapaService.remover(req.params.id);
    res.status(204).end();
  }),
);

export default router;
