import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    decimal,
} from "drizzle-orm/pg-core";

// Workouts table
export const workouts = pgTable("workouts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// Exercises table (exercise library/catalog)
export const exercises = pgTable("exercises", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// Workout exercises junction table
export const workoutExercises = pgTable("workout_exercises", {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
        .notNull()
        .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
        .notNull()
        .references(() => exercises.id),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sets table
export const sets = pgTable("sets", {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutExerciseId: uuid("workout_exercise_id")
        .notNull()
        .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    reps: integer("reps"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
