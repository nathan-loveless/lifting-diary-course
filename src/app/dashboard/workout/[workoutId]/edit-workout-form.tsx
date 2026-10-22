"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateWorkoutAction } from "./actions";

export function EditWorkoutForm({
  workoutId,
  defaultName,
  defaultStartedAt,
}: {
  workoutId: string;
  defaultName: string;
  defaultStartedAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{ name?: string[] }>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const startedAt = String(data.get("startedAt") ?? "");

    startTransition(async () => {
      const result = await updateWorkoutAction({
        workoutId,
        name,
        startedAt: new Date(startedAt),
      });
      if (result.success) {
        router.push(`/dashboard?date=${format(new Date(startedAt), "yyyy-MM-dd")}`);
      } else {
        setErrors(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name[0]}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startedAt">Start time</Label>
        <Input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          defaultValue={defaultStartedAt}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
