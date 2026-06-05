import bcrypt from "bcryptjs";
import {
  PrismaClient,
  NivelPermissao,
  TipoAeronave,
  TipoPeca,
  StatusPeca,
  StatusEtapa,
  TipoTeste,
  ResultadoTeste,
} from "@prisma/client";

const prisma = new PrismaClient();

// Dados iniciais derivados do protótipo da AV2, convertidos para os enums e
// regras da AV1. Senha padrão de todos os usuários de teste: "123456".
async function main() {
  // Limpa as tabelas respeitando as dependências (FKs).
  await prisma.etapaFuncionario.deleteMany();
  await prisma.aeronavePeca.deleteMany();
  await prisma.teste.deleteMany();
  await prisma.etapa.deleteMany();
  await prisma.aeronave.deleteMany();
  await prisma.peca.deleteMany();
  await prisma.funcionario.deleteMany();

  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.funcionario.createMany({
    data: [
      { id: "F-001", nome: "Gerson Costa", telefone: "+55 12 99181-2230", endereco: "Rua das Acácias, 220 — São José dos Campos", usuario: "gerson", senhaHash, nivelPermissao: NivelPermissao.ADMINISTRADOR },
      { id: "F-002", nome: "Rafael Lima", telefone: "+55 12 99654-1102", endereco: "Av. Brasil, 1430 — Taubaté", usuario: "rlima", senhaHash, nivelPermissao: NivelPermissao.ENGENHEIRO },
      { id: "F-003", nome: "Carolina Ferreira", telefone: "+55 11 98123-7741", endereco: "Rua Bela Cintra, 88 — São Paulo", usuario: "cferreira", senhaHash, nivelPermissao: NivelPermissao.OPERADOR },
      { id: "F-004", nome: "João Almeida", telefone: "+55 12 99002-5510", endereco: "Rua Itapeva, 12 — Jacareí", usuario: "jalmeida", senhaHash, nivelPermissao: NivelPermissao.OPERADOR },
      { id: "F-005", nome: "Beatriz Nogueira", telefone: "+55 11 99771-4002", endereco: "Av. Paulista, 1009 — São Paulo", usuario: "bnogueira", senhaHash, nivelPermissao: NivelPermissao.ENGENHEIRO },
    ],
  });

  await prisma.peca.createMany({
    data: [
      { id: "P-1001", nome: "Turbofan TF-3000", tipo: TipoPeca.NACIONAL, fornecedor: "AeroTech Brasil", status: StatusPeca.PRONTA },
      { id: "P-1002", nome: "Asa Modular MK-II", tipo: TipoPeca.NACIONAL, fornecedor: "Embracoda S.A.", status: StatusPeca.PRONTA },
      { id: "P-1003", nome: "Aviônica IFR-410", tipo: TipoPeca.IMPORTADA, fornecedor: "Avionics Tech", status: StatusPeca.EM_TRANSPORTE },
      { id: "P-1004", nome: "Trem de Pouso Reforçado", tipo: TipoPeca.IMPORTADA, fornecedor: "Heavy Parts Ind.", status: StatusPeca.PRONTA },
      { id: "P-1005", nome: "Tanque de Combustível 1200L", tipo: TipoPeca.IMPORTADA, fornecedor: "FuelSys", status: StatusPeca.EM_PRODUCAO },
      { id: "P-1006", nome: "Painel de Controle Pro-7", tipo: TipoPeca.IMPORTADA, fornecedor: "Avionics Tech", status: StatusPeca.PRONTA },
      { id: "P-1007", nome: "Hélice Composta CC-9", tipo: TipoPeca.IMPORTADA, fornecedor: "PropMakers", status: StatusPeca.PRONTA },
    ],
  });

  await prisma.aeronave.createMany({
    data: [
      { codigo: "AC-21", modelo: "Pelicano", tipo: TipoAeronave.COMERCIAL, capacidade: 12, alcance: 4200, descricao: "Aeronave de carga média projetada para rotas regionais. Configuração padrão com porão pressurizado." },
      { codigo: "AC-30", modelo: "Albatroz", tipo: TipoAeronave.COMERCIAL, capacidade: 78, alcance: 3100, descricao: "Jato regional para rotas curtas e médias, com alta eficiência de combustível." },
      { codigo: "AC-08", modelo: "Andorinha", tipo: TipoAeronave.COMERCIAL, capacidade: 2, alcance: 1100, descricao: "Aeronave de treinamento básico, monomotor." },
      { codigo: "AC-44", modelo: "Tucano X", tipo: TipoAeronave.MILITAR, capacidade: 1, alcance: 2300, descricao: "Aeronave militar de treinamento avançado e ataque leve." },
    ],
  });

  await prisma.etapa.createMany({
    data: [
      // AC-21 — sequência respeitando "uma etapa em andamento por vez"
      { id: "E-100", nome: "Estrutura Central", prazo: "2026-04-15", status: StatusEtapa.CONCLUIDA, ordem: 0, aeronaveId: "AC-21", descricao: "Montagem da estrutura central da fuselagem." },
      { id: "E-101", nome: "Montagem de Asa Direita", prazo: "2026-05-22", status: StatusEtapa.ANDAMENTO, ordem: 1, aeronaveId: "AC-21", descricao: "Acoplamento e fixação da asa direita à fuselagem central, incluindo a passagem do chicote elétrico." },
      { id: "E-117", nome: "Inspeção Estrutural", prazo: "2026-05-30", status: StatusEtapa.PENDENTE, ordem: 2, aeronaveId: "AC-21", descricao: "Inspeção visual e ultrassônica das junções estruturais." },
      { id: "E-118", nome: "Pintura Externa", prazo: "2026-06-20", status: StatusEtapa.PENDENTE, ordem: 3, aeronaveId: "AC-21", descricao: "Aplicação do esquema de pintura padrão." },
      // AC-30
      { id: "E-200", nome: "Fuselagem", prazo: "2026-03-01", status: StatusEtapa.CONCLUIDA, ordem: 0, aeronaveId: "AC-30", descricao: "Construção da fuselagem completa." },
      { id: "E-204", nome: "Calibração de Aviônicos", prazo: "2026-06-04", status: StatusEtapa.PENDENTE, ordem: 1, aeronaveId: "AC-30", descricao: "Calibração e validação dos sistemas de aviônica." },
      { id: "E-308", nome: "Teste de Pressurização", prazo: "2026-06-12", status: StatusEtapa.PENDENTE, ordem: 2, aeronaveId: "AC-30", descricao: "Validação do sistema de pressurização da cabine." },
      // AC-08
      { id: "E-501", nome: "Verificação Final", prazo: "2026-05-12", status: StatusEtapa.ANDAMENTO, ordem: 0, aeronaveId: "AC-08", descricao: "Checklist final de pré-entrega." },
      // AC-44
      { id: "E-601", nome: "Sistema de Armamento", prazo: "2026-07-04", status: StatusEtapa.PENDENTE, ordem: 0, aeronaveId: "AC-44", descricao: "Integração do sistema de armamento e cabos." },
    ],
  });

  await prisma.teste.createMany({
    data: [
      { tipo: TipoTeste.ELETRICO, resultado: ResultadoTeste.APROVADO, aeronaveId: "AC-21" },
      { tipo: TipoTeste.HIDRAULICO, resultado: ResultadoTeste.APROVADO, aeronaveId: "AC-21" },
      { tipo: TipoTeste.AERODINAMICO, resultado: ResultadoTeste.REPROVADO, aeronaveId: "AC-21" },
      { tipo: TipoTeste.ELETRICO, resultado: ResultadoTeste.APROVADO, aeronaveId: "AC-30" },
      { tipo: TipoTeste.ELETRICO, resultado: ResultadoTeste.APROVADO, aeronaveId: "AC-08" },
      { tipo: TipoTeste.HIDRAULICO, resultado: ResultadoTeste.APROVADO, aeronaveId: "AC-08" },
      { tipo: TipoTeste.AERODINAMICO, resultado: ResultadoTeste.APROVADO, aeronaveId: "AC-08" },
    ],
  });

  await prisma.aeronavePeca.createMany({
    data: [
      { aeronaveId: "AC-21", pecaId: "P-1002" },
      { aeronaveId: "AC-21", pecaId: "P-1004" },
      { aeronaveId: "AC-21", pecaId: "P-1007" },
      { aeronaveId: "AC-30", pecaId: "P-1001" },
      { aeronaveId: "AC-30", pecaId: "P-1003" },
      { aeronaveId: "AC-30", pecaId: "P-1006" },
      { aeronaveId: "AC-08", pecaId: "P-1007" },
      { aeronaveId: "AC-08", pecaId: "P-1004" },
      { aeronaveId: "AC-44", pecaId: "P-1001" },
    ],
  });

  await prisma.etapaFuncionario.createMany({
    data: [
      { etapaId: "E-100", funcionarioId: "F-001" },
      { etapaId: "E-100", funcionarioId: "F-004" },
      { etapaId: "E-101", funcionarioId: "F-001" },
      { etapaId: "E-101", funcionarioId: "F-002" },
      { etapaId: "E-117", funcionarioId: "F-003" },
      { etapaId: "E-200", funcionarioId: "F-002" },
      { etapaId: "E-204", funcionarioId: "F-002" },
      { etapaId: "E-308", funcionarioId: "F-005" },
      { etapaId: "E-501", funcionarioId: "F-003" },
      { etapaId: "E-501", funcionarioId: "F-004" },
      { etapaId: "E-601", funcionarioId: "F-002" },
    ],
  });

  console.log("✔ Seed concluído com sucesso.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Erro ao executar o seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
