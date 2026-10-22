"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateWorkout } from "@/data/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  startedAt: z.coerce.date(),
});

type UpdateWorkoutParams = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(params: UpdateWorkoutParams) {
  const parsed = updateWorkoutSchema.safeParse(params);
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

  const workout = await updateWorkout(
    parsed.data.workoutId,
    parsed.data.name,
    parsed.data.startedAt,
  );
  if (!workout) {
    return { success: false as const, error: { name: ["Workout not found"] } };
  }

  revalidatePath("/dashboard");
  return { success: true as const };
}
