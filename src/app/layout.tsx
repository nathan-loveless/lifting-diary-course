import { Suspense } from "react";
import { ClerkProvider, Show, SignOutButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lifting Diary",
  description: "A lifting diary app with Clerk authentication.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          {children}
          <Suspense>
            <Show when="signed-in">
              <div className="fixed right-4 top-4 z-50">
                <SignOutButton redirectUrl="/">
                  <Button variant="outline" size="sm">
                    Log out
                  </Button>
                </SignOutButton>
              </div>
            </Show>
          </Suspense>
        </ClerkProvider>
        <ThemeToggle />
      </body>
    </html>
  );
}