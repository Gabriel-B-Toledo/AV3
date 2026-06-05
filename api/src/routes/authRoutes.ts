import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../http";
import * as authService from "../services/authService";

const router = Router();

const loginSchema = z.object({
  usuario: z.string().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha."),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { usuario, senha } = loginSchema.parse(req.body);
    const resultado = await authService.login(usuario, senha);
    res.json(resultado);
  }),
);

export default router;
