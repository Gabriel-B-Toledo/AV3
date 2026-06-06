import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../http";
import * as authService from "../services/authService";

const router = Router();

// Limita tentativas de login para dificultar ataques de força bruta.
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const loginSchema = z.object({
  usuario: z.string().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha."),
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { usuario, senha } = loginSchema.parse(req.body);
    const resultado = await authService.login(usuario, senha);
    res.json(resultado);
  }),
);

export default router;
