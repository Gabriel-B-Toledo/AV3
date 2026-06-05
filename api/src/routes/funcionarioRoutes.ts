import { Router } from "express";
import { z } from "zod";
import { NivelPermissao } from "@prisma/client";
import { asyncHandler, AppError } from "../http";
import { autenticar, exigirNivel } from "../middleware/auth";
import * as funcionarioService from "../services/funcionarioService";

const router = Router();

router.use(autenticar);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await funcionarioService.listar());
  }),
);

const criarSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  telefone: z.string().min(1),
  endereco: z.string().min(1),
  usuario: z.string().min(1),
  senha: z.string().min(4, "A senha deve ter ao menos 4 caracteres."),
  nivelPermissao: z.nativeEnum(NivelPermissao),
});

// CRUD de funcionários é restrito ao administrador (controle de acesso da AV1).
router.post(
  "/",
  exigirNivel(NivelPermissao.ADMINISTRADOR),
  asyncHandler(async (req, res) => {
    const dados = criarSchema.parse(req.body);
    res.status(201).json(await funcionarioService.criar(dados));
  }),
);

const atualizarSchema = z.object({
  nome: z.string().min(1).optional(),
  telefone: z.string().min(1).optional(),
  endereco: z.string().min(1).optional(),
  senha: z.string().min(4).optional(),
  nivelPermissao: z.nativeEnum(NivelPermissao).optional(),
});

router.put(
  "/:id",
  exigirNivel(NivelPermissao.ADMINISTRADOR),
  asyncHandler(async (req, res) => {
    const dados = atualizarSchema.parse(req.body);
    res.json(await funcionarioService.atualizar(req.params.id, dados));
  }),
);

router.delete(
  "/:id",
  exigirNivel(NivelPermissao.ADMINISTRADOR),
  asyncHandler(async (req, res) => {
    // Evita que o administrador exclua a própria conta e perca o acesso.
    if (req.user?.sub === req.params.id) {
      throw new AppError(400, "Você não pode excluir o próprio usuário.");
    }
    await funcionarioService.remover(req.params.id);
    res.status(204).end();
  }),
);

export default router;
