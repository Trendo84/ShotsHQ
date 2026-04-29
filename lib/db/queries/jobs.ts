import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiJobs, type AiJob } from "@/lib/db/schema";

export async function recordJobStart(input: {
  userId: string;
  projectId?: string;
  type: AiJob["type"];
  triggerRunId: string;
  costCredits: number;
  payload: Record<string, unknown>;
}): Promise<AiJob> {
  const [row] = await db.insert(aiJobs).values({
    userId:       input.userId,
    projectId:    input.projectId ?? null,
    type:         input.type,
    status:       "running",
    triggerRunId: input.triggerRunId,
    costCredits:  input.costCredits,
    input:        input.payload,
  }).returning();
  if (!row) throw new Error("failed to record job start");
  return row;
}

export async function completeJob(id: string, output: unknown): Promise<void> {
  await db
    .update(aiJobs)
    .set({ status: "completed", output: output as AiJob["output"], updatedAt: new Date() })
    .where(eq(aiJobs.id, id));
}

export async function failJob(id: string, error: string): Promise<void> {
  await db
    .update(aiJobs)
    .set({ status: "failed", error, updatedAt: new Date() })
    .where(eq(aiJobs.id, id));
}
