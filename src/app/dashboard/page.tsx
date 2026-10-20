"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Placeholder UI data only - to be replaced once data fetching is built.
const placeholderWorkouts = [
  { id: 1, name: "Upper Body Push", exercises: 5, sets: 18 },
  { id: 2, name: "Evening Accessory Work", exercises: 3, sets: 9 },
];

export default function DashboardPage() {
  // Set after mount so the current time isn't baked in at prerender.
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(new Date());
  }, []);

  const formattedDate = date ? format(date, "do MMM yyyy") : "Select date";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" className="w-56 justify-start" />}
          >
            <CalendarIcon />
            {formattedDate}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selected) => selected && setDate(selected)}
              defaultMonth={date}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <CardDescription>
            Logged on {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {placeholderWorkouts.map((workout) => (
            <Card key={workout.id} size="sm">
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
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
