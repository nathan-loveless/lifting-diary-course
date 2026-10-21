# Auth Coding Standards

These standards apply to everything to do with authentication and authorization throughout this project.

## 1. Clerk ONLY

**This app uses [Clerk](https://clerk.com/) (`@clerk/nextjs`) for ALL authentication.**

- Do **NOT** build custom auth: no hand-rolled sessions, JWT handling, password storage, cookies, or login forms backed by our own database.
- Do **NOT** introduce any other auth library (NextAuth/Auth.js, Better Auth, Lucia, Supabase Auth, Neon Auth, etc.).
- Clerk owns identity. Our database only stores the Clerk user ID (a string, e.g. `user_2abc...`) as a foreign-key-style `userId` column on user-owned rows. Do not duplicate passwords, emails or profile data in our own tables unless a doc says otherwise.

## 2. Setup

- `<ClerkProvider>` wraps the app in `src/app/layout.tsx`.
- `clerkMiddleware()` is registered in `src/proxy.ts`. In this Next.js version the middleware file is named `proxy.ts` (not `middleware.ts`). Read the relevant guide in `node_modules/next/dist/docs/` before changing it.
- Keep `clerkMiddleware()` bare. It lets Clerk read the session; it is **not** where we decide which routes need auth (see section 3).
- Clerk keys live in `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`). Never commit them or hard-code them.
- Server-side Clerk imports come from `@clerk/nextjs/server`; client components and UI components come from `@clerk/nextjs`.

## 3. Protect Each Resource Where It Runs

Authorization is enforced at the resource itself, not just by redirects.

- Every protected **page** (server component) must verify the user itself. A proxy redirect is only a latency optimisation, never the security boundary.
- Every **data helper** in `/data` must verify the user and scope its query to that user (see `docs/data-fetching.md`, section 3).
- Every **server action** must verify the user before doing anything.

Use `auth()` from `@clerk/nextjs/server` on the server:

```ts
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth.protect();
  // userId is a string here; signed-out users never reach this line
}
```

Use `auth.protect()` when signed-out users should be redirected to sign-in, and `const { userId } = await auth()` when you need to branch on signed-in vs signed-out yourself.

## 4. Getting the Current User

- **Always** get the user ID from Clerk on the server (`auth()` / `auth.protect()`).
- **Never** accept a `userId` from the client, URL, search params, form data, or request body.
- Pass the verified `userId` into `/data` helpers as an argument; the helpers then scope every query to it.
- Use `currentUser()` from `@clerk/nextjs/server` only when you actually need profile data (name, email, image). Prefer `auth()` when the ID is enough, since it does not make an extra API call.

```ts
// src/app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const { userId } = await auth.protect();
  const workouts = await getWorkouts(userId);
  // ...
}
```

## 5. Sign-in, Sign-up and User UI

- Use Clerk's prebuilt components for auth UI: `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignedIn>`, `<SignedOut>` (and `<SignIn>` / `<SignUp>` if dedicated pages are needed).
- Do not build custom sign-in or sign-up forms. If heavy customisation is ever needed, use the Clerk custom-UI APIs and raise it first.
- Auth UI must still follow `docs/ui.md`: any surrounding UI is composed from shadcn/ui components only.
- Prefer modal mode (`<SignInButton mode="modal">`) for sign-in and sign-up triggers unless a dedicated page is requested.
- Client components may use Clerk hooks (`useUser`, `useAuth`) purely for **display** (e.g. showing a name). They must never be used to make authorization decisions or to fetch data.

## 6. Don'ts

- Don't check auth only on the client.
- Don't rely on hiding a button or route for security.
- Don't trust the `userId` in a route param, query string or body.
- Don't log or expose session tokens, secret keys or full user objects.
- Don't create API route handlers just to expose the current user; fetch on the server (see `docs/data-fetching.md`).

## Checklist

- [ ] Auth is handled by Clerk, with no custom auth code or other auth libraries
- [ ] The page / server action / data helper verifies the user itself via `auth()` or `auth.protect()` from `@clerk/nextjs/server`
- [ ] The user ID comes from Clerk on the server, never from client input
- [ ] Queries are scoped to that user ID
- [ ] Auth UI uses Clerk components, not custom forms
- [ ] Secrets stay in `.env.local`
