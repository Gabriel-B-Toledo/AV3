import { Router } from "express";
import { z } from "zod";
import { TipoAeronave, TipoTeste, ResultadoTeste, NivelPermissao } from "@prisma/client";
import { asyncHandler } from "../http";
import { autenticar, exigirNivel } from "../middleware/auth";
import * as aeronaveService from "../services/aeronaveService";
import * as etapaService from "../services/etapaService";
import * as relatorioService from "../services/relatorioService";

const router = Router();
const GESTAO = [NivelPermissao.ADMINISTRADOR, NivelPermissao.ENGENHEIRO] as const;

router.use(autenticar);

// -------- CRUD da aeronave --------

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await aeronaveService.listar());
  }),
);

router.get(
  "/:codigo",
  asyncHandler(async (req, res) => {
    res.json(await aeronaveService.obter(req.params.codigo));
  }),
);

const criarSchema = z.object({
  codigo: z.string().min(1),
  modelo: z.string().min(1),
  tipo: z.nativeEnum(TipoAeronave),
  capacidade: z.coerce.number().int().nonnegative(),
  alcance: z.coerce.number().int().nonnegative(),
  descricao: z.string().optional(),
});

router.post(
  "/",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const dados = criarSchema.parse(req.body);
    res.status(201).json(await aeronaveService.criar(dados));
  }),
);

const atualizarSchema = criarSchema.partial().omit({ codigo: true });

router.put(
  "/:codigo",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const dados = atualizarSchema.parse(req.body);
    res.json(await aeronaveService.atualizar(req.params.codigo, dados));
  }),
);

router.delete(
  "/:codigo",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    await aeronaveService.remover(req.params.codigo);
    res.status(204).end();
  }),
);

// -------- Peças vinculadas --------

const vincularPecaSchema = z.object({ pecaId: z.string().min(1) });

router.post(
  "/:codigo/pecas",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const { pecaId } = vincularPecaSchema.parse(req.body);
    res.json(await aeronaveService.vincularPeca(req.params.codigo, pecaId));
  }),
);

router.delete(
  "/:codigo/pecas/:pecaId",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    res.json(await aeronaveService.desvincularPeca(req.params.codigo, req.params.pecaId));
  }),
);

// -------- Testes --------

const testeSchema = z.object({
  tipo: z.nativeEnum(TipoTeste),
  resultado: z.nativeEnum(ResultadoTeste),
});

router.post(
  "/:codigo/testes",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const { tipo, resultado } = testeSchema.parse(req.body);
    res.status(201).json(await aeronaveService.adicionarTeste(req.params.codigo, tipo, resultado));
  }),
);

router.delete(
  "/:codigo/testes/:testeId",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    res.json(await aeronaveService.removerTeste(req.params.codigo, req.params.testeId));
  }),
);

// -------- Etapas --------

const etapaSchema = z.object({
  nome: z.string().min(1),
  prazo: z.string().min(1),
  descricao: z.string().optional(),
});

router.post(
  "/:codigo/etapas",
  exigirNivel(...GESTAO),
  asyncHandler(async (req, res) => {
    const dados = etapaSchema.parse(req.body);
    await etapaService.criar(req.params.codigo, dados);
    res.status(201).json(await aeronaveService.obter(req.params.codigo));
  }),
);

// -------- Relatório final --------

const relatorioSchema = z.object({
  nomeCliente: z.string().min(1, "Informe o nome do cliente."),
  dataEntrega: z.string().min(1, "Informe a data de entrega."),
});

router.post(
  "/:codigo/relatorio",
  asyncHandler(async (req, res) => {
    const { nomeCliente, dataEntrega } = relatorioSchema.parse(req.body);
    const resultado = await relatorioService.gerar(req.params.codigo, nomeCliente, dataEntrega);
    res.json(resultado);
  }),
);

export default router;
