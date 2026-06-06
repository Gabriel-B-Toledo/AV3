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

async function main() {
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
      { id: "F-067", nome: "Gerson", telefone: "+55 12 99181-2230", endereco: "Rua das Acácias, 220 - São José dos Campos", usuario: "gerson", senhaHash, nivelPermissao: NivelPermissao.ADMINISTRADOR },
      { id: "F-001", nome: "Admin", telefone: "+55 12 99654-1102", endereco: "Av. Brasil, 1430 - Taubaté", usuario: "admin", senhaHash, nivelPermissao: NivelPermissao.ADMINISTRADOR },
      { id: "F-002", nome: "Engenheiro", telefone: "+55 11 98123-7741", endereco: "Rua Bela Cintra, 88 - São Paulo", usuario: "engineer", senhaHash, nivelPermissao: NivelPermissao.ENGENHEIRO },
      { id: "F-003", nome: "Operador", telefone: "+55 12 99002-5510", endereco: "Rua Itapeva, 12 - Jacareí", usuario: "operator", senhaHash, nivelPermissao: NivelPermissao.OPERADOR },
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
      { codigo: "AC-21", modelo: "Pelicano", tipo: TipoAeronave.COMERCIAL, capacidade: 30, alcance: 1750, descricao: "Turboélice bimotor pressurizado para rotas regionais de curta distância. Cabine conversível entre transporte de passageiros e carga, com bom desempenho em pistas curtas e velocidade de cruzeiro de 550 km/h." },
      { codigo: "AC-30", modelo: "Albatroz", tipo: TipoAeronave.COMERCIAL, capacidade: 88, alcance: 3700, descricao: "Jato regional de corredor único com dois motores turbofan de alta eficiência. Otimizado para rotas curtas e médias, cruzeiro a Mach 0,82 e teto de serviço de 12.500 m." },
      { codigo: "AC-08", modelo: "Andorinha", tipo: TipoAeronave.COMERCIAL, capacidade: 2, alcance: 1000, descricao: "Monomotor a pistão para treinamento primário, com dois assentos lado a lado, trem de pouso fixo e instrumentação para voo VFR. Velocidade de cruzeiro de 200 km/h." },
      { codigo: "AC-44", modelo: "Tucano X", tipo: TipoAeronave.MILITAR, capacidade: 2, alcance: 1550, descricao: "Monoturboélice militar de treinamento avançado e ataque leve, com cockpit em tandem para dois tripulantes, assentos ejetáveis, blindagem e cinco pontos de fixação para armamento. Cruzeiro de 520 km/h." },
    ],
  });

  await prisma.etapa.createMany({
    data: [
      { id: "E-100", nome: "Estrutura Central", prazo: "2026-04-15", status: StatusEtapa.CONCLUIDA, ordem: 0, aeronaveId: "AC-21", descricao: "Montagem da estrutura central da fuselagem." },
      { id: "E-101", nome: "Montagem de Asa Direita", prazo: "2026-05-22", status: StatusEtapa.ANDAMENTO, ordem: 1, aeronaveId: "AC-21", descricao: "Acoplamento e fixação da asa direita à fuselagem central, incluindo a passagem do chicote elétrico." },
      { id: "E-117", nome: "Inspeção Estrutural", prazo: "2026-05-30", status: StatusEtapa.PENDENTE, ordem: 2, aeronaveId: "AC-21", descricao: "Inspeção visual e ultrassônica das junções estruturais." },
      { id: "E-118", nome: "Pintura Externa", prazo: "2026-06-20", status: StatusEtapa.PENDENTE, ordem: 3, aeronaveId: "AC-21", descricao: "Aplicação do esquema de pintura padrão." },
      { id: "E-200", nome: "Fuselagem", prazo: "2026-03-01", status: StatusEtapa.CONCLUIDA, ordem: 0, aeronaveId: "AC-30", descricao: "Construção da fuselagem completa." },
      { id: "E-204", nome: "Calibração de Aviônicos", prazo: "2026-06-04", status: StatusEtapa.PENDENTE, ordem: 1, aeronaveId: "AC-30", descricao: "Calibração e validação dos sistemas de aviônica." },
      { id: "E-308", nome: "Teste de Pressurização", prazo: "2026-06-12", status: StatusEtapa.PENDENTE, ordem: 2, aeronaveId: "AC-30", descricao: "Validação do sistema de pressurização da cabine." },
      { id: "E-501", nome: "Verificação Final", prazo: "2026-05-12", status: StatusEtapa.ANDAMENTO, ordem: 0, aeronaveId: "AC-08", descricao: "Checklist final de pré-entrega." },
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
      { etapaId: "E-100", funcionarioId: "F-067" },
      { etapaId: "E-101", funcionarioId: "F-002" },
      { etapaId: "E-101", funcionarioId: "F-003" },
      { etapaId: "E-117", funcionarioId: "F-003" },
      { etapaId: "E-200", funcionarioId: "F-003" },
      { etapaId: "E-204", funcionarioId: "F-003" },
      { etapaId: "E-308", funcionarioId: "F-003" },
      { etapaId: "E-501", funcionarioId: "F-001" },
      { etapaId: "E-501", funcionarioId: "F-067" },
      { etapaId: "E-601", funcionarioId: "F-002" },
    ],
  });

  console.log("Seed concluído com sucesso.");
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
