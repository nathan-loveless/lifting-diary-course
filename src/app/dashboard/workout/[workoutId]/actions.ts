"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addExerciseToWorkout,
  addSet,
  createExercise,
  deleteSet,
  removeWorkoutExercise,
  updateSet,
} from "@/data/exercises";
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

const notSignedIn = { success: false as const, error: "Not signed in" };
const notFoundResult = { success: false as const, error: "Not found" };

function revalidateWorkout(workoutId: string) {
  revalidatePath(`/dashboard/workout/${workoutId}`);
  revalidatePath("/dashboard");
}

const createExerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

type CreateExerciseParams = z.infer<typeof createExerciseSchema>;

export async function createExerciseAction(params: CreateExerciseParams) {
  const parsed = createExerciseSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false as const,
      error: z.flattenError(parsed.error).fieldErrors.name?.[0] ?? "Invalid name",
    };
  }

  const { userId } = await auth();
  if (!userId) return notSignedIn;

  const exercise = await createExercise(parsed.data.name);
  return { success: true as const, exercise };
}

const addExerciseToWorkoutSchema = z.object({
  workoutId: z.uuid(),
  exerciseId: z.uuid(),
});

type AddExerciseToWorkoutParams = z.infer<typeof addExerciseToWorkoutSchema>;

export async function addExerciseToWorkoutAction(
  params: AddExerciseToWorkoutParams,
) {
  const parsed = addExerciseToWorkoutSchema.safeParse(params);
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const { userId } = await auth();
  if (!userId) return notSignedIn;

  const result = await addExerciseToWorkout(
    parsed.data.workoutId,
    parsed.data.exerciseId,
  );
  if (!result) return notFoundResult;

  revalidateWorkout(parsed.data.workoutId);
  return { success: true as const };
}

const removeExerciseSchema = z.object({
  workoutId: z.uuid(),
  workoutExerciseId: z.uuid(),
});

type RemoveExerciseParams = z.infer<typeof removeExerciseSchema>;

export async function removeExerciseFromWorkoutAction(
  params: RemoveExerciseParams,
) {
  const parsed = removeExerciseSchema.safeParse(params);
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const { userId } = await auth();
  if (!userId) return notSignedIn;

  const removed = await removeWorkoutExercise(
    parsed.data.workoutId,
    parsed.data.workoutExerciseId,
  );
  if (!removed) return notFoundResult;

  revalidateWorkout(parsed.data.workoutId);
  return { success: true as const };
}

const setValuesSchema = {
  weight: z
    .number()
    .min(0, "Weight can't be negative")
    .max(10000, "Weight is too large")
    .multipleOf(0.01, "Max 2 decimal places")
    .nullable(),
  reps: z
    .number()
    .int("Reps must be a whole number")
    .min(0, "Reps can't be negative")
    .max(1000, "Reps is too large")
    .nullable(),
};

const addSetSchema = z.object({
  workoutId: z.uuid(),
  workoutExerciseId: z.uuid(),
  ...setValuesSchema,
});

type AddSetParams = z.infer<typeof addSetSchema>;

export async function addSetAction(params: AddSetParams) {
  const parsed = addSetSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { userId } = await auth();
  if (!userId) return notSignedIn;

  const set = await addSet(parsed.data.workoutId, parsed.data.workoutExerciseId, {
    weight: parsed.data.weight,
    reps: parsed.data.reps,
  });
  if (!set) return notFoundResult;

  revalidateWorkout(parsed.data.workoutId);
  return { success: true as const };
}

const updateSetSchema = z.object({
  workoutId: z.uuid(),
  workoutExerciseId: z.uuid(),
  setId: z.uuid(),
  ...setValuesSchema,
});

type UpdateSetParams = z.infer<typeof updateSetSchema>;

export async function updateSetAction(params: UpdateSetParams) {
  const parsed = updateSetSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { userId } = await auth();
  if (!userId) return notSignedIn;

  const set = await updateSet(
    parsed.data.workoutId,
    parsed.data.workoutExerciseId,
    parsed.data.setId,
    { weight: parsed.data.weight, reps: parsed.data.reps },
  );
  if (!set) return notFoundResult;

  revalidateWorkout(parsed.data.workoutId);
  return { success: true as const };
}

const deleteSetSchema = z.object({
  workoutId: z.uuid(),
  workoutExerciseId: z.uuid(),
  setId: z.uuid(),
});

type DeleteSetParams = z.infer<typeof deleteSetSchema>;

export async function deleteSetAction(params: DeleteSetParams) {
  const parsed = deleteSetSchema.safeParse(params);
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const { userId } = await auth();
  if (!userId) return notSignedIn;

  const deleted = await deleteSet(
    parsed.data.workoutId,
    parsed.data.workoutExerciseId,
    parsed.data.setId,
  );
  if (!deleted) return notFoundResult;

  revalidateWorkout(parsed.data.workoutId);
  return { success: true as const };
}
