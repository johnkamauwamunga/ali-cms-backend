import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "../../db/prisma.js";
import { successResponse } from "../../lib/response.js";
import type { AppEnv } from "../../types/context.js";

export const projectRoutes = new Hono<AppEnv>();

const projectSelection = {
  id: true,
  title: true,
  slug: true,
  description: true,
  shortDescription: true,
  thumbnailUrl: true,
  githubUrl: true,
  liveDemoUrl: true,
  isFeatured: true,
  displayOrder: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  technologies: {
    orderBy: { sortOrder: "asc" as const },
    select: { name: true },
  },
};

const toPublicProject = (project: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  githubUrl: string | null;
  liveDemoUrl: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  technologies: Array<{ name: string }>;
}) => ({
  id: project.id,
  title: project.title,
  slug: project.slug,
  description: project.description ?? project.shortDescription ?? "",
  image: project.thumbnailUrl ?? "",
  category: "",
  technologies: project.technologies.map(({ name }) => name),
  githubUrl: project.githubUrl ?? "",
  liveUrl: project.liveDemoUrl ?? "",
  featured: project.isFeatured,
  published: true,
  sortOrder: project.displayOrder,
  createdAt: project.createdAt.toISOString(),
  updatedAt: project.updatedAt.toISOString(),
});

projectRoutes.get("/", async (context) => {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
    select: projectSelection,
  });

  return context.json(
    successResponse("Published projects retrieved", projects.map(toPublicProject)),
  );
});

projectRoutes.get("/:slug", async (context) => {
  const project = await prisma.project.findFirst({
    where: {
      slug: context.req.param("slug"),
      status: "PUBLISHED",
    },
    select: projectSelection,
  });

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  return context.json(
    successResponse("Published project retrieved", toPublicProject(project)),
  );
});
