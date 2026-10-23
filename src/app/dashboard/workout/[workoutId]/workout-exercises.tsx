"use client";

import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  addSetAction,
  deleteSetAction,
  removeExerciseFromWorkoutAction,
  updateSetAction,
} from "./actions";

type SetRow = {
  id: string;
  setNumber: number;
  weight: string | null;
  reps: number | null;
};

type WorkoutExerciseRow = {
  id: string;
  exerciseName: string;
  sets: SetRow[];
};

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function WorkoutExercises({
  workoutId,
  workoutExercises,
}: {
  workoutId: string;
  workoutExercises: WorkoutExerciseRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<{ success: true } | { success: false; error: string }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) setError(result.error);
    });
  }

  if (workoutExercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No exercises yet. Add one below to start logging sets.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {workoutExercises.map((we, index) => (
        <div key={we.id} className="flex flex-col gap-3">
          {index > 0 && <Separator />}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium">{we.exerciseName}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() =>
                  removeExerciseFromWorkoutAction({
                    workoutId,
                    workoutExerciseId: we.id,
                  }),
                )
              }
            >
              Remove
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Set</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {we.sets.map((set) => (
                <ExistingSetRow
                  key={`${set.id}-${set.weight}-${set.reps}-${set.setNumber}`}
                  set={set}
                  disabled={pending}
                  onSave={(weight, reps) =>
                    run(() =>
                      updateSetAction({
                        workoutId,
                        workoutExerciseId: we.id,
                        setId: set.id,
                        weight,
                        reps,
                      }),
                    )
                  }
                  onDelete={() =>
                    run(() =>
                      deleteSetAction({
                        workoutId,
                        workoutExerciseId: we.id,
                        setId: set.id,
                      }),
                    )
                  }
                />
              ))}
              <NewSetRow
                key={`new-${we.id}-${we.sets.length}`}
                previous={we.sets[we.sets.length - 1]}
                disabled={pending}
                onAdd={(weight, reps) =>
                  run(() =>
                    addSetAction({
                      workoutId,
                      workoutExerciseId: we.id,
                      weight,
                      reps,
                    }),
                  )
                }
              />
            </TableBody>
          </Table>
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ExistingSetRow({
  set,
  disabled,
  onSave,
  onDelete,
}: {
  set: SetRow;
  disabled: boolean;
  onSave: (weight: number | null, reps: number | null) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(set.weight ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  function save() {
    if (weight === (set.weight ?? "") && reps === (set.reps?.toString() ?? "")) {
      return;
    }
    onSave(toNumberOrNull(weight), toNumberOrNull(reps));
  }

  return (
    <TableRow>
      <TableCell>{set.setNumber}</TableCell>
      <TableCell>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          aria-label={`Set ${set.setNumber} weight`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={save}
          disabled={disabled}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          aria-label={`Set ${set.setNumber} reps`}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={save}
          disabled={disabled}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NewSetRow({
  previous,
  disabled,
  onAdd,
}: {
  previous: SetRow | undefined;
  disabled: boolean;
  onAdd: (weight: number | null, reps: number | null) => void;
}) {
  const [weight, setWeight] = useState(previous?.weight ?? "");
  const [reps, setReps] = useState(previous?.reps?.toString() ?? "");
  const formId = useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onAdd(toNumberOrNull(weight), toNumberOrNull(reps));
  }

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">
        {(previous?.setNumber ?? 0) + 1}
      </TableCell>
      <TableCell>
        <form id={formId} onSubmit={submit} className="contents" />
        <Input
          form={formId}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="Weight"
          aria-label="New set weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={disabled}
        />
      </TableCell>
      <TableCell>
        <Input
          form={formId}
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          placeholder="Reps"
          aria-label="New set reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          disabled={disabled}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button type="submit" form={formId} size="sm" disabled={disabled}>
          Add set
        </Button>
      </TableCell>
    </TableRow>
  );
}
