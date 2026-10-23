"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addExerciseToWorkoutAction, createExerciseAction } from "./actions";

export function AddExercise({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addSelected() {
    if (!exerciseId) return;
    setError(null);
    startTransition(async () => {
      const result = await addExerciseToWorkoutAction({ workoutId, exerciseId });
      if (result.success) setExerciseId(null);
      else setError(result.error);
    });
  }

  function createAndAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const created = await createExerciseAction({ name: newName });
      if (!created.success) {
        setError(created.error);
        return;
      }
      const added = await addExerciseToWorkoutAction({
        workoutId,
        exerciseId: created.exercise.id,
      });
      if (added.success) setNewName("");
      else setError(added.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Add an existing exercise</Label>
          <div className="flex gap-2">
            <Select
              value={exerciseId}
              onValueChange={setExerciseId}
              items={exercises.map((e) => ({ value: e.id, label: e.name }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose an exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addSelected}
              disabled={pending || !exerciseId}
            >
              Add
            </Button>
          </div>
        </div>
      )}
      <form onSubmit={createAndAdd} className="flex flex-col gap-2">
        <Label htmlFor="new-exercise">Or create a new exercise</Label>
        <div className="flex gap-2">
          <Input
            id="new-exercise"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Bench press"
            maxLength={100}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={pending || newName.trim() === ""}
          >
            Create &amp; add
          </Button>
        </div>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
