-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Admin_email_key`(`email`),
    UNIQUE INDEX `Admin_phone_key`(`phone`),
    INDEX `Admin_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` VARCHAR(36) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userAgent` VARCHAR(512) NULL,
    `ipAddress` VARCHAR(45) NULL,

    UNIQUE INDEX `RefreshToken_tokenHash_key`(`tokenHash`),
    INDEX `RefreshToken_adminId_expiresAt_idx`(`adminId`, `expiresAt`),
    INDEX `RefreshToken_revokedAt_idx`(`revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityQuestion` (
    `id` VARCHAR(36) NOT NULL,
    `question` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SecurityQuestion_question_key`(`question`),
    INDEX `SecurityQuestion_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthSettings` (
    `id` VARCHAR(36) NOT NULL DEFAULT 'singleton',
    `adminId` VARCHAR(36) NOT NULL,
    `selectedSecurityQuestionId` VARCHAR(36) NULL,
    `securityAnswerHash` VARCHAR(255) NULL,
    `loginEnabled` BOOLEAN NOT NULL DEFAULT true,
    `requireSecurityQuestion` BOOLEAN NOT NULL DEFAULT false,
    `maxFailedLoginAttempts` INTEGER NOT NULL DEFAULT 5,
    `lockoutDurationMinutes` INTEGER NOT NULL DEFAULT 15,
    `sessionDurationMinutes` INTEGER NOT NULL DEFAULT 10080,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AuthSettings_adminId_key`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` VARCHAR(36) NOT NULL DEFAULT 'singleton',
    `fullName` VARCHAR(160) NOT NULL,
    `professionalTitle` VARCHAR(200) NOT NULL,
    `biography` LONGTEXT NULL,
    `location` VARCHAR(255) NULL,
    `email` VARCHAR(254) NULL,
    `phone` VARCHAR(32) NULL,
    `profileImageUrl` VARCHAR(2048) NULL,
    `cvIntroduction` LONGTEXT NULL,
    `socialLinks` JSON NULL,
    `availabilityStatus` VARCHAR(64) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Profile_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Experience` (
    `id` VARCHAR(36) NOT NULL,
    `company` VARCHAR(200) NOT NULL,
    `position` VARCHAR(200) NOT NULL,
    `location` VARCHAR(255) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `description` LONGTEXT NULL,
    `responsibilities` JSON NULL,
    `achievements` JSON NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Experience_status_displayOrder_idx`(`status`, `displayOrder`),
    INDEX `Experience_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SkillCategory` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SkillCategory_name_key`(`name`),
    UNIQUE INDEX `SkillCategory_slug_key`(`slug`),
    INDEX `SkillCategory_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skill` (
    `id` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `iconIdentifier` VARCHAR(120) NULL,
    `iconSource` VARCHAR(2048) NULL,
    `proficiencyLevel` INTEGER NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `animationEnabled` BOOLEAN NOT NULL DEFAULT false,
    `animationStyle` VARCHAR(80) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Skill_slug_key`(`slug`),
    INDEX `Skill_categoryId_displayOrder_idx`(`categoryId`, `displayOrder`),
    INDEX `Skill_status_displayOrder_idx`(`status`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `shortDescription` VARCHAR(500) NULL,
    `description` LONGTEXT NULL,
    `thumbnailUrl` VARCHAR(2048) NULL,
    `galleryImages` JSON NULL,
    `githubUrl` VARCHAR(2048) NULL,
    `liveDemoUrl` VARCHAR(2048) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    INDEX `Project_status_displayOrder_idx`(`status`, `displayOrder`),
    INDEX `Project_isFeatured_status_idx`(`isFeatured`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectTechnology` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProjectTechnology_projectId_sortOrder_idx`(`projectId`, `sortOrder`),
    UNIQUE INDEX `ProjectTechnology_projectId_name_key`(`projectId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Education` (
    `id` VARCHAR(36) NOT NULL,
    `institution` VARCHAR(200) NOT NULL,
    `qualification` VARCHAR(200) NOT NULL,
    `fieldOfStudy` VARCHAR(200) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `description` LONGTEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Education_status_displayOrder_idx`(`status`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certification` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `issuingOrganization` VARCHAR(200) NOT NULL,
    `issueDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NULL,
    `credentialId` VARCHAR(200) NULL,
    `credentialUrl` VARCHAR(2048) NULL,
    `certificateImageUrl` VARCHAR(2048) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Certification_status_displayOrder_idx`(`status`, `displayOrder`),
    INDEX `Certification_issueDate_idx`(`issueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interest` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(120) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Interest_name_key`(`name`),
    INDEX `Interest_status_displayOrder_idx`(`status`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reference` (
    `id` VARCHAR(36) NOT NULL,
    `fullName` VARCHAR(160) NOT NULL,
    `position` VARCHAR(200) NULL,
    `organization` VARCHAR(200) NULL,
    `email` VARCHAR(254) NULL,
    `phone` VARCHAR(32) NULL,
    `relationship` VARCHAR(120) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `includeInCv` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reference_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVProfile` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `template` VARCHAR(80) NOT NULL DEFAULT 'classic',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CVProfile_slug_key`(`slug`),
    INDEX `CVProfile_isPublished_idx`(`isPublished`),
    INDEX `CVProfile_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVExperience` (
    `cvProfileId` VARCHAR(36) NOT NULL,
    `experienceId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVExperience_experienceId_idx`(`experienceId`),
    INDEX `CVExperience_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    PRIMARY KEY (`cvProfileId`, `experienceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVSkill` (
    `cvProfileId` VARCHAR(36) NOT NULL,
    `skillId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVSkill_skillId_idx`(`skillId`),
    INDEX `CVSkill_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    PRIMARY KEY (`cvProfileId`, `skillId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVProject` (
    `cvProfileId` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVProject_projectId_idx`(`projectId`),
    INDEX `CVProject_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    PRIMARY KEY (`cvProfileId`, `projectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVEducation` (
    `cvProfileId` VARCHAR(36) NOT NULL,
    `educationId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVEducation_educationId_idx`(`educationId`),
    INDEX `CVEducation_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    PRIMARY KEY (`cvProfileId`, `educationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVCertification` (
    `cvProfileId` VARCHAR(36) NOT NULL,
    `certificationId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVCertification_certificationId_idx`(`certificationId`),
    INDEX `CVCertification_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    PRIMARY KEY (`cvProfileId`, `certificationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVReference` (
    `cvProfileId` VARCHAR(36) NOT NULL,
    `referenceId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVReference_referenceId_idx`(`referenceId`),
    INDEX `CVReference_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    PRIMARY KEY (`cvProfileId`, `referenceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVSection` (
    `id` VARCHAR(36) NOT NULL,
    `cvProfileId` VARCHAR(36) NOT NULL,
    `sectionKey` VARCHAR(80) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CVSection_cvProfileId_displayOrder_idx`(`cvProfileId`, `displayOrder`),
    UNIQUE INDEX `CVSection_cvProfileId_sectionKey_key`(`cvProfileId`, `sectionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CVSettings` (
    `id` VARCHAR(36) NOT NULL,
    `cvProfileId` VARCHAR(36) NOT NULL,
    `fontFamily` VARCHAR(100) NOT NULL DEFAULT 'Inter',
    `fontSize` INTEGER NOT NULL DEFAULT 11,
    `accentColor` CHAR(7) NOT NULL DEFAULT '#1f2937',
    `pageSize` ENUM('A4', 'LETTER') NOT NULL DEFAULT 'A4',
    `marginTopMm` INTEGER NOT NULL DEFAULT 16,
    `marginRightMm` INTEGER NOT NULL DEFAULT 16,
    `marginBottomMm` INTEGER NOT NULL DEFAULT 16,
    `marginLeftMm` INTEGER NOT NULL DEFAULT 16,
    `showReferences` BOOLEAN NOT NULL DEFAULT false,
    `showContactInformation` BOOLEAN NOT NULL DEFAULT true,
    `showProfileImage` BOOLEAN NOT NULL DEFAULT false,
    `dateFormat` VARCHAR(40) NOT NULL DEFAULT 'MMM yyyy',
    `displayPreferences` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CVSettings_cvProfileId_key`(`cvProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortfolioSettings` (
    `id` VARCHAR(36) NOT NULL DEFAULT 'singleton',
    `theme` VARCHAR(40) NOT NULL DEFAULT 'system',
    `accentColor` CHAR(7) NOT NULL DEFAULT '#1f2937',
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `showContactSection` BOOLEAN NOT NULL DEFAULT true,
    `socialLinks` JSON NULL,
    `sectionOrder` JSON NULL,
    `seoTitle` VARCHAR(200) NULL,
    `seoDescription` VARCHAR(500) NULL,
    `animationSettings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(36) NOT NULL,
    `senderName` VARCHAR(160) NOT NULL,
    `senderEmail` VARCHAR(254) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `message` LONGTEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContactMessage_isArchived_isRead_createdAt_idx`(`isArchived`, `isRead`, `createdAt`),
    INDEX `ContactMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RateLimitBucket` (
    `id` CHAR(64) NOT NULL,
    `windowStartedAt` DATETIME(3) NOT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RateLimitBucket_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthSettings` ADD CONSTRAINT `AuthSettings_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthSettings` ADD CONSTRAINT `AuthSettings_selectedSecurityQuestionId_fkey` FOREIGN KEY (`selectedSecurityQuestionId`) REFERENCES `SecurityQuestion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Skill` ADD CONSTRAINT `Skill_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `SkillCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectTechnology` ADD CONSTRAINT `ProjectTechnology_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVExperience` ADD CONSTRAINT `CVExperience_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVExperience` ADD CONSTRAINT `CVExperience_experienceId_fkey` FOREIGN KEY (`experienceId`) REFERENCES `Experience`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVSkill` ADD CONSTRAINT `CVSkill_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVSkill` ADD CONSTRAINT `CVSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVProject` ADD CONSTRAINT `CVProject_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVProject` ADD CONSTRAINT `CVProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVEducation` ADD CONSTRAINT `CVEducation_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVEducation` ADD CONSTRAINT `CVEducation_educationId_fkey` FOREIGN KEY (`educationId`) REFERENCES `Education`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVCertification` ADD CONSTRAINT `CVCertification_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVCertification` ADD CONSTRAINT `CVCertification_certificationId_fkey` FOREIGN KEY (`certificationId`) REFERENCES `Certification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVReference` ADD CONSTRAINT `CVReference_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVReference` ADD CONSTRAINT `CVReference_referenceId_fkey` FOREIGN KEY (`referenceId`) REFERENCES `Reference`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVSection` ADD CONSTRAINT `CVSection_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CVSettings` ADD CONSTRAINT `CVSettings_cvProfileId_fkey` FOREIGN KEY (`cvProfileId`) REFERENCES `CVProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
