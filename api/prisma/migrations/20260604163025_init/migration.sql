-- CreateTable
CREATE TABLE `funcionarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `usuario` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `nivelPermissao` ENUM('ADMINISTRADOR', 'ENGENHEIRO', 'OPERADOR') NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `funcionarios_usuario_key`(`usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aeronaves` (
    `codigo` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `tipo` ENUM('COMERCIAL', 'MILITAR') NOT NULL,
    `capacidade` INTEGER NOT NULL,
    `alcance` INTEGER NOT NULL,
    `descricao` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`codigo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pecas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('NACIONAL', 'IMPORTADA') NOT NULL,
    `fornecedor` VARCHAR(191) NOT NULL,
    `status` ENUM('EM_PRODUCAO', 'EM_TRANSPORTE', 'PRONTA') NOT NULL DEFAULT 'EM_PRODUCAO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etapas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `prazo` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'ANDAMENTO', 'CONCLUIDA') NOT NULL DEFAULT 'PENDENTE',
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `descricao` TEXT NULL,
    `aeronaveId` VARCHAR(191) NOT NULL,

    INDEX `etapas_aeronaveId_idx`(`aeronaveId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testes` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ELETRICO', 'HIDRAULICO', 'AERODINAMICO') NOT NULL,
    `resultado` ENUM('APROVADO', 'REPROVADO') NOT NULL,
    `aeronaveId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `testes_aeronaveId_idx`(`aeronaveId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aeronave_pecas` (
    `aeronaveId` VARCHAR(191) NOT NULL,
    `pecaId` VARCHAR(191) NOT NULL,

    INDEX `aeronave_pecas_pecaId_idx`(`pecaId`),
    PRIMARY KEY (`aeronaveId`, `pecaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etapa_funcionarios` (
    `etapaId` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,

    INDEX `etapa_funcionarios_funcionarioId_idx`(`funcionarioId`),
    PRIMARY KEY (`etapaId`, `funcionarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `etapas` ADD CONSTRAINT `etapas_aeronaveId_fkey` FOREIGN KEY (`aeronaveId`) REFERENCES `aeronaves`(`codigo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testes` ADD CONSTRAINT `testes_aeronaveId_fkey` FOREIGN KEY (`aeronaveId`) REFERENCES `aeronaves`(`codigo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aeronave_pecas` ADD CONSTRAINT `aeronave_pecas_aeronaveId_fkey` FOREIGN KEY (`aeronaveId`) REFERENCES `aeronaves`(`codigo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aeronave_pecas` ADD CONSTRAINT `aeronave_pecas_pecaId_fkey` FOREIGN KEY (`pecaId`) REFERENCES `pecas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etapa_funcionarios` ADD CONSTRAINT `etapa_funcionarios_etapaId_fkey` FOREIGN KEY (`etapaId`) REFERENCES `etapas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etapa_funcionarios` ADD CONSTRAINT `etapa_funcionarios_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
