import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

async function RedirectIfSignedIn() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return null;
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f1e8] text-slate-950">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_38%),radial-gradient(circle_at_80%_20%,_rgba(241,196,15,0.22),_transparent_28%),linear-gradient(180deg,_#f6f1e8_0%,_#efe7da_100%)]" />
      <div className="absolute -left-28 top-28 h-72 w-72 rounded-full bg-[#1f4b3d]/10 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#9b4d2d]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/60 px-5 py-3 shadow-[0_14px_40px_rgba(39,31,23,0.08)] backdrop-blur">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1f4b3d]"
          >
            Lifting Diary
          </Link>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Suspense>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="rounded-full px-4 py-2 text-slate-700 transition hover:bg-slate-950 hover:text-white">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-[#1f4b3d]">
                    Create account
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <span className="text-slate-600">Signed in</span>
                <UserButton />
              </Show>
            </Suspense>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-[#1f4b3d]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#1f4b3d] shadow-sm">
              Clerk is live
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Track every lift with a cleaner, safer sign-in flow.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700 sm:text-xl">
              The app is now wired to Clerk, with claimable development keys,
              route protection hooks, and dedicated sign-in and sign-up pages.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Suspense>
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button className="inline-flex h-12 items-center justify-center rounded-full bg-[#1f4b3d] px-6 text-sm font-semibold text-white shadow-lg shadow-[#1f4b3d]/20 transition hover:bg-[#17392e]">
                      Create your account
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white">
                      Sign in
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <div className="inline-flex h-12 items-center rounded-full border border-[#1f4b3d]/20 bg-white/80 px-5 text-sm font-medium text-slate-700 shadow-sm">
                    Your profile menu is ready in the header.
                  </div>
                </Show>
              </Suspense>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(39,31,23,0.12)] backdrop-blur">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/60">
                Setup status
              </p>
              <div className="mt-8 space-y-5 text-sm leading-6 text-white/80">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span>Provider</span>
                  <span className="font-medium text-white">ClerkProvider</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span>Middleware</span>
                  <span className="font-medium text-white">Configured</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span>Auth pages</span>
                  <span className="font-medium text-white">
                    /sign-in and /sign-up
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Skills</span>
                  <span className="font-medium text-white">Installed</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
