import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, type NewProject, type Project } from "@/lib/db/schema";

export async function listProjectsForUser(userId: string): Promise<Project[]> {
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProject(id: string, userId: string): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  return row ?? null;
}

export async function createProject(input: NewProject): Promise<Project> {
  const [row] = await db.insert(projects).values(input).returning();
  if (!row) throw new Error("Failed to create project");
  return row;
}

export async function updateProjectCanvas(
  id: string,
  userId: string,
  polotnoJson: unknown,
): Promise<void> {
  await db
    .update(projects)
    .set({ polotnoJson: polotnoJson as Project["polotnoJson"], updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}
