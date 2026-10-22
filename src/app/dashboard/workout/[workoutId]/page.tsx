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
import { getWorkoutById } from "@/data/workouts";

import { EditWorkoutForm } from "./edit-workout-form";

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

  const workout = await getWorkoutById(workoutId);
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
    </main>
  );
}
