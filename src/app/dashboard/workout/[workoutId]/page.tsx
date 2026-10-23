import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAvailableExercises } from "@/data/exercises";
import { getWorkoutWithExercises } from "@/data/workouts";

import { AddExercise } from "./add-exercise";
import { EditWorkoutForm } from "./edit-workout-form";
import { WorkoutExercises } from "./workout-exercises";

export default function EditWorkoutPage(
  props: PageProps<"/dashboard/workout/[workoutId]">,
) {
  return (
    <Suspense>
      <EditWorkoutContent params={props.params} />
    </Suspense>
  );
}

async function EditWorkoutContent({
  params,
}: {
  params: PageProps<"/dashboard/workout/[workoutId]">["params"];
}) {
  await auth.protect();
  const { workoutId } = await params;
  if (!z.uuid().safeParse(workoutId).success) notFound();

  const [workout, availableExercises] = await Promise.all([
    getWorkoutWithExercises(workoutId),
    getAvailableExercises(),
  ]);
  if (!workout) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit workout</CardTitle>
          <CardDescription>Update the details of this workout.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditWorkoutForm
            workoutId={workout.id}
            defaultName={workout.name}
            defaultStartedAt={format(workout.startedAt, "yyyy-MM-dd'T'HH:mm")}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <CardDescription>
            Log the exercises and sets you performed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <WorkoutExercises
            workoutId={workout.id}
            workoutExercises={workout.workoutExercises.map((we) => ({
              id: we.id,
              exerciseName: we.exercise?.name ?? "Unknown exercise",
              sets: we.sets.map((s) => ({
                id: s.id,
                setNumber: s.setNumber,
                weight: s.weight,
                reps: s.reps,
              })),
            }))}
          />
          <Separator />
          <AddExercise workoutId={workout.id} exercises={availableExercises} />
        </CardContent>
      </Card>
    </main>
  );
}
