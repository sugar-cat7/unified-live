import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "../shared/components/containers/ThemeProvider";
import { Toaster } from "../shared/components/ui/toaster";

export const metadata: Metadata = {
  title: "App Template",
  description: "Full-stack web application template with Next.js and Hono API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body text-foreground">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to main content
          </a>
          <div className="relative min-h-screen overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-0 bg-app-gradient"
            />
            <main id="main-content" tabIndex={-1} className="relative z-10">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
