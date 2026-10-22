# Data Mutations Standards

These standards apply to all data mutations (inserts, updates, deletes) throughout this project. They are incredibly important.

## 1. Database Mutations: `/data` Helper Functions ONLY

- All data mutations MUST be done via helper functions located in the `/data` directory (i.e. `src/data/`).
- Server actions must never touch the database directly; they call these helpers.
- Helper functions MUST wrap their database calls using **Drizzle ORM**.
- **DO NOT USE RAW SQL.** No `sql` template strings for whole queries, no `db.execute()` with raw SQL, no other database clients or drivers used directly.

```ts
// src/data/workouts.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function createWorkout(userId: string, name: string, date: Date) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name, date })
    .returning();
  return workout;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

## 2. Server Actions ONLY

**ALL data mutations MUST be done via server actions.**

- Mutations must **NOT** be done via route handlers (`route.ts` / `app/api/...`).
- Mutations must **NOT** be done directly from client components or in any other way.
- Server actions MUST live in a colocated file named `actions.ts`, next to the route/component that uses them (e.g. `src/app/dashboard/actions.ts`).
- Every `actions.ts` file MUST begin with the `"use server"` directive.

## 3. Server Action Parameters

- All server action parameters MUST be explicitly typed.
- Server action parameters MUST **NOT** use the `FormData` type. Accept plain, typed objects instead.

```ts
// Good
export async function createWorkoutAction(params: { name: string; date: Date }) {}

// Bad
export async function createWorkoutAction(formData: FormData) {}
```

## 4. Validation with Zod (REQUIRED)

**ALL server actions MUST validate the arguments passed to them using [zod](https://zod.dev).**

- Define a zod schema for each server action's arguments, and parse the arguments with it before doing anything else.
- Derive the parameter type from the schema with `z.infer` so the type and validation cannot drift apart.
- Use `safeParse` (or catch `parse` errors) and return a typed error result rather than letting unvalidated data reach `/data` helpers.

## 5. User Data Isolation (CRITICAL)

**A logged-in user can ONLY mutate their own data.**

- Get the user ID from the authenticated session on the server inside the server action. **Never** accept a user ID as an action argument or trust one from the client.
- Pass the session user ID into the `/data` helper; updates and deletes MUST include the user ID in their `where` clause.
- If there is no logged-in user, the action must not mutate anything (redirect to sign-in or return an error before calling any helper).

## 6. No `redirect()` in Server Actions

- Server actions MUST **NOT** call `redirect()` from `next/navigation`.
- Redirects MUST be done client side (e.g. `router.push()`) after the call to the server action resolves, based on the result it returns.

```ts
// Good: the client redirects once the action resolves
const result = await createWorkoutAction({ name, startedAt });
if (result.success) router.push("/dashboard");

// Bad: redirecting inside the server action
export async function createWorkoutAction(params: CreateWorkoutParams) {
  // ...
  redirect("/dashboard");
}
```

## Full Example

```ts
// src/app/dashboard/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createWorkout } from "@/data/workouts";
// import { getCurrentUserId } from "@/lib/auth"; // use the project's auth helper

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.coerce.date(),
});

type CreateWorkoutParams = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(params: CreateWorkoutParams) {
  const parsed = createWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const userId = await getCurrentUserId();
  const workout = await createWorkout(userId, parsed.data.name, parsed.data.date);

  revalidatePath("/dashboard");
  return { success: true as const, workout };
}
```

## Checklist

- [ ] The mutation lives in a helper function in `/data`
- [ ] The helper uses Drizzle ORM, with no raw SQL
- [ ] The helper is called from a server action in a colocated `actions.ts` file (with `"use server"`)
- [ ] Server action parameters are typed and do NOT use `FormData`
- [ ] Server action arguments are validated with zod before use
- [ ] The user ID comes from the server session, and the mutation is scoped to it
- [ ] The server action does not call `redirect()`; the client redirects after the action resolves
