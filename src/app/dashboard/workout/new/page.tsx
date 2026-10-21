import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { WorkoutForm } from "./workout-form";

export default function NewWorkoutPage() {
  return (
    <Suspense>
      <NewWorkoutContent />
    </Suspense>
  );
}

async function NewWorkoutContent() {
  await auth.protect();
  // Defer to request time: the current time is unstable during prerender.
  await connection();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>New workout</CardTitle>
          <CardDescription>Create a workout to start logging.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkoutForm
            defaultStartedAt={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          />
        </CardContent>
      </Card>
    </main>
  );
}
