import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

const requiredEnvironmentValue = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const seed = async (): Promise<void> => {
  const adminName = requiredEnvironmentValue("SEED_ADMIN_NAME");
  const adminEmail = requiredEnvironmentValue("SEED_ADMIN_EMAIL").toLowerCase();
  const adminPassword = requiredEnvironmentValue("SEED_ADMIN_PASSWORD");

  if (adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        authSettings: {
          create: {
            loginEnabled: true,
          },
        },
      },
    });
  }

  await prisma.profile.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      fullName: "Portfolio Owner",
      professionalTitle: "Software Developer",
      biography: "A sample profile for local development.",
      status: "PUBLISHED",
    },
    update: {},
  });

  await prisma.portfolioSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", isPublic: true },
    update: {},
  });

  const sampleProjects = [
    {
      title: "Sample Portfolio Project",
      slug: "sample-portfolio-project",
      shortDescription: "A sample project for local development.",
      description: "Replace this sample content with your own project details.",
      isFeatured: true,
      displayOrder: 0,
      technologies: ["TypeScript", "React"],
    },
    {
      title: "Sample CMS Project",
      slug: "sample-cms-project",
      shortDescription: "A second sample project for local development.",
      description: "A sample project record managed by the Ali CMS backend.",
      isFeatured: false,
      displayOrder: 1,
      technologies: ["Node.js", "MySQL"],
    },
  ];

  for (const { technologies, ...project } of sampleProjects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: {
        ...project,
        status: "PUBLISHED",
        technologies: {
          create: technologies.map((name, sortOrder) => ({
            name,
            sortOrder,
          })),
        },
      },
      update: {},
    });
  }

  console.info("Prisma seed completed.");
};

try {
  await seed();
} catch (error) {
  console.error("Prisma seed failed.", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
