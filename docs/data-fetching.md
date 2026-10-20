# Data Fetching Standards

These standards apply to all data fetching and database access throughout this project. They are incredibly important.

## 1. Server Components ONLY

**ALL data fetching within this app MUST be done via server components.**

- Data must **NOT** be fetched via route handlers (`route.ts` / `app/api/...`).
- Data must **NOT** be fetched via client components (no `useEffect` + `fetch`, SWR, React Query, etc.).
- Data must **NOT** be fetched in any other way. ONLY server components.

Server components fetch the data they need by calling helper functions from the `/data` directory (see below), and pass the results down to child components as props.

## 2. Database Queries: `/data` Helper Functions ONLY

- All database queries MUST be done via helper functions located in the `/data` directory (i.e. `src/data/`).
- Server components must never query the database directly; they call these helpers.
- Helper functions MUST use **Drizzle ORM** to query the database.
- **DO NOT USE RAW SQL.** No `sql` template strings for whole queries, no `db.execute()` with raw SQL, no other database clients or drivers used directly.

```ts
// src/data/workouts.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function getWorkouts(userId: string) {
  return db.select().from(workouts).where(eq(workouts.userId, userId));
}
```

## 3. User Data Isolation (CRITICAL)

**A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.**

- Every helper function in `/data` that reads or writes user-owned data MUST scope the query to the current logged-in user's ID.
- Get the user ID from the authenticated session on the server (inside the server component / data helper). **Never** trust a user ID supplied by the client, URL, search params, or request body.
- When fetching a single record by ID (e.g. a workout), the query MUST also filter by the logged-in user's ID, so that guessing another record's ID returns nothing:

  ```ts
  export async function getWorkoutById(userId: string, workoutId: string) {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
    return workout ?? null;
  }
  ```

- Updates and deletes MUST likewise include the user ID in their `where` clause.
- If there is no logged-in user, the data helper must not return any data (redirect to sign-in or throw before querying).
- Never write a helper that returns data across all users to a regular user.

## Checklist

- [ ] Data is fetched in a server component (not a route handler, not a client component)
- [ ] The query lives in a helper function in `/data`
- [ ] The helper uses Drizzle ORM, with no raw SQL
- [ ] The query is scoped to the logged-in user's ID
