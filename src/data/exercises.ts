import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  exercises as exercisesTable,
  sets as setsTable,
  workoutExercises as workoutExercisesTable,
} from "@/db/schema";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

async function findOwnedWorkout(workoutId: string, userId: string) {
  const workout = await db.query.workouts.findFirst({
    where: { id: workoutId, userId },
    columns: { id: true },
  });
  return workout ?? null;
}

async function findOwnedWorkoutExercise(
  workoutId: string,
  workoutExerciseId: string,
  userId: string,
) {
  if (!(await findOwnedWorkout(workoutId, userId))) return null;
  const workoutExercise = await db.query.workoutExercises.findFirst({
    where: { id: workoutExerciseId, workoutId },
    columns: { id: true },
  });
  return workoutExercise ?? null;
}

export async function getAvailableExercises() {
  const userId = await requireUserId();

  return db
    .select({ id: exercisesTable.id, name: exercisesTable.name })
    .from(exercisesTable)
    .where(or(isNull(exercisesTable.userId), eq(exercisesTable.userId, userId)))
    .orderBy(asc(exercisesTable.name));
}

export async function createExercise(name: string) {
  const userId = await requireUserId();

  const existing = await db
    .select({ id: exercisesTable.id, name: exercisesTable.name })
    .from(exercisesTable)
    .where(
      and(
        or(isNull(exercisesTable.userId), eq(exercisesTable.userId, userId)),
        eq(sql`lower(${exercisesTable.name})`, name.toLowerCase()),
      ),
    );
  if (existing[0]) return existing[0];

  const [exercise] = await db
    .insert(exercisesTable)
    .values({ userId, name })
    .returning({ id: exercisesTable.id, name: exercisesTable.name });
  return exercise;
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
) {
  const userId = await requireUserId();

  if (!(await findOwnedWorkout(workoutId, userId))) return null;

  const [exercise] = await db
    .select({ id: exercisesTable.id })
    .from(exercisesTable)
    .where(
      and(
        eq(exercisesTable.id, exerciseId),
        or(isNull(exercisesTable.userId), eq(exercisesTable.userId, userId)),
      ),
    );
  if (!exercise) return null;

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${workoutExercisesTable.order}), 0)` })
    .from(workoutExercisesTable)
    .where(eq(workoutExercisesTable.workoutId, workoutId));

  const [workoutExercise] = await db
    .insert(workoutExercisesTable)
    .values({ workoutId, exerciseId, order: Number(maxOrder) + 1 })
    .returning();
  return workoutExercise;
}

export async function removeWorkoutExercise(
  workoutId: string,
  workoutExerciseId: string,
) {
  const userId = await requireUserId();

  if (!(await findOwnedWorkoutExercise(workoutId, workoutExerciseId, userId))) {
    return false;
  }

  await db
    .delete(workoutExercisesTable)
    .where(
      and(
        eq(workoutExercisesTable.id, workoutExerciseId),
        eq(workoutExercisesTable.workoutId, workoutId),
      ),
    );
  return true;
}

type SetValues = { weight: number | null; reps: number | null };

export async function addSet(
  workoutId: string,
  workoutExerciseId: string,
  values: SetValues,
) {
  const userId = await requireUserId();

  if (!(await findOwnedWorkoutExercise(workoutId, workoutExerciseId, userId))) {
    return null;
  }

  const [{ maxSet }] = await db
    .select({ maxSet: sql<number>`coalesce(max(${setsTable.setNumber}), 0)` })
    .from(setsTable)
    .where(eq(setsTable.workoutExerciseId, workoutExerciseId));

  const [set] = await db
    .insert(setsTable)
    .values({
      workoutExerciseId,
      setNumber: Number(maxSet) + 1,
      weight: values.weight === null ? null : String(values.weight),
      reps: values.reps,
    })
    .returning();
  return set;
}

export async function updateSet(
  workoutId: string,
  workoutExerciseId: string,
  setId: string,
  values: SetValues,
) {
  const userId = await requireUserId();

  if (!(await findOwnedWorkoutExercise(workoutId, workoutExerciseId, userId))) {
    return null;
  }

  const [set] = await db
    .update(setsTable)
    .set({
      weight: values.weight === null ? null : String(values.weight),
      reps: values.reps,
    })
    .where(
      and(
        eq(setsTable.id, setId),
        eq(setsTable.workoutExerciseId, workoutExerciseId),
      ),
    )
    .returning();
  return set ?? null;
}

export async function deleteSet(
  workoutId: string,
  workoutExerciseId: string,
  setId: string,
) {
  const userId = await requireUserId();

  if (!(await findOwnedWorkoutExercise(workoutId, workoutExerciseId, userId))) {
    return false;
  }

  const [target] = await db
    .select({ setNumber: setsTable.setNumber })
    .from(setsTable)
    .where(
      and(
        eq(setsTable.id, setId),
        eq(setsTable.workoutExerciseId, workoutExerciseId),
      ),
    );
  if (!target) return false;

  // neon-http has no interactive transactions; batch runs atomically.
  await db.batch([
    db.delete(setsTable).where(eq(setsTable.id, setId)),
    db
      .update(setsTable)
      .set({ setNumber: sql`${setsTable.setNumber} - 1` })
      .where(
        and(
          eq(setsTable.workoutExerciseId, workoutExerciseId),
          gt(setsTable.setNumber, target.setNumber),
        ),
      ),
  ]);
  return true;
}
