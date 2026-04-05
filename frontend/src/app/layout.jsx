import { Navbar } from "@/components/navbar";
import { DbVisualizer } from "@/components/db-visualizer";
import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "GDPS — Game Distribution Platform",
  description: "Digital Game Distribution Platform (SDD demo)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-steam-bg">
        <Providers>
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1a2f4a_0%,_transparent_55%)] opacity-60" />
          <Navbar />
          <main className="relative z-10 mx-auto max-w-7xl px-4 py-8">{children}</main>
          <DbVisualizer />
        </Providers>
      </body>
    </html>
  );
}
