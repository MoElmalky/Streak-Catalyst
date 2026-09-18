import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catalyst – Elemental Streak Tracker",
  description:
    "Evolving habit streak tracker with 5 physical elemental catalyst stages: Ember Flame, Plasma Burst, Solar Flare, Cosmic Vortex, and Supernova Singularity.",
  keywords: ["habit tracker", "streak tracker", "elemental catalyst", "gamified habits", "supabase"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
