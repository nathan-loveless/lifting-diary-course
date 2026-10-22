import { format, isValid, parse } from "date-fns";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWorkoutsForDate } from "@/data/workouts";

import { DatePicker } from "./date-picker";

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Suspense>
        <DashboardContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { date: dateParam } = await searchParams;
  // Defer to request time: the current date is unstable during prerender.
  await connection();
  const parsed =
    typeof dateParam === "string"
      ? parse(dateParam, "yyyy-MM-dd", new Date())
      : new Date();
  const date = isValid(parsed) ? parsed : new Date();

  const workouts = await getWorkoutsForDate(date);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <DatePicker date={format(date, "yyyy-MM-dd")} />
          <Button render={<Link href="/dashboard/workout/new" />} nativeButton={false}>
            Create workout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <CardDescription>
            Logged on {format(date, "do MMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {workouts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No workouts logged for this date.
            </p>
          )}
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/dashboard/workout/${workout.id}`}>
            <Card size="sm" className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{workout.name}</CardTitle>
                <CardDescription className="flex gap-2">
                  <Badge variant="secondary">
                    {workout.exercises} exercises
                  </Badge>
                  <Badge variant="secondary">{workout.sets} sets</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
