import { Router } from "express";
import { z } from "zod";
import { TipoPeca, StatusPeca, NivelPermissao } from "@prisma/client";
import { asyncHandler } from "../http";
import { autenticar, exigirNivel } from "../middleware/auth";
import * as pecaService from "../services/pecaService";

const router = Router();
const GESTAO = [NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO] as const;
const COM_OPERADOR = [...GESTAO, NivelPermissao.OPERADOR] as const;

router.use(autenticar);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await pecaService.listar());
  }),
);

const criarSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  tipo: z.nativeEnum(TipoPeca),
  fornecedor: z.string().min(1),
  status: z.nativeEnum(StatusPeca).optional(),
});

router.post(
  "/",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const dados = criarSchema.parse(req.body);
    res.status(201).json(await pecaService.criar(dados));
  }),
);

const statusSchema = z.object({ status: z.nativeEnum(StatusPeca) });

router.patch(
  "/:id/status",
  exigirNivel(...COM_OPERADOR),
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    res.json(await pecaService.atualizarStatus(req.params.id, status));
  }),
);

router.delete(
  "/:id",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    await pecaService.remover(req.params.id);
    res.status(204).end();
  }),
);

export default router;
