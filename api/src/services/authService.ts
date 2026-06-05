import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { env } from "../env";
import { AppError } from "../http";

// Autentica por usuário/senha (espelha Funcionario.autenticar da AV1, mas com
// senha protegida por hash bcrypt) e emite um token JWT.
export async function login(usuario: string, senha: string) {
  const funcionario = await prisma.funcionario.findUnique({ where: { usuario } });
  if (!funcionario) throw new AppError(401, "Usuário ou senha inválidos.");

  const senhaConfere = await bcrypt.compare(senha, funcionario.senhaHash);
  if (!senhaConfere) throw new AppError(401, "Usuário ou senha inválidos.");

  const payload = {
    sub: funcionario.id,
    usuario: funcionario.usuario,
    nome: funcionario.nome,
    nivel: funcionario.nivelPermissao,
  };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: "8h" });

  return {
    token,
    usuario: {
      id: funcionario.id,
      nome: funcionario.nome,
      usuario: funcionario.usuario,
      nivelPermissao: funcionario.nivelPermissao,
    },
  };
}
