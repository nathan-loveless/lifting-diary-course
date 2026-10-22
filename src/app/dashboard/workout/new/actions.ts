"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  startedAt: z.coerce.date(),
});

type CreateWorkoutParams = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(params: CreateWorkoutParams) {
  const parsed = createWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false as const,
      error: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false as const, error: { name: ["Not signed in"] } };
  }

  await createWorkout(parsed.data.name, parsed.data.startedAt);

  revalidatePath("/dashboard");
  return { success: true as const };
}
