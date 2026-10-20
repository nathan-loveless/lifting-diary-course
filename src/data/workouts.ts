import "server-only";

import { auth } from "@clerk/nextjs/server";
import { endOfDay, startOfDay } from "date-fns";
import { redirect } from "next/navigation";

import { db } from "@/db";

export async function getWorkoutsForDate(date: Date) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workouts = await db.query.workouts.findMany({
    where: {
      userId,
      startedAt: { gte: startOfDay(date), lte: endOfDay(date) },
    },
    with: { workoutExercises: { with: { sets: true } } },
    orderBy: { startedAt: "asc" },
  });

  return workouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    exercises: workout.workoutExercises.length,
    sets: workout.workoutExercises.reduce((n, we) => n + we.sets.length, 0),
  }));
}
