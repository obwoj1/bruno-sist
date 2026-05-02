import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Bruno‑Sist",
  description: "AI lecture transcriber and summarizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <a href="/" className="font-semibold">Bruno‑Sist</a>
            <nav className="flex gap-4 text-sm text-zinc-700 dark:text-zinc-300">
              <a className="hover:underline" href="/labs">Labs</a>
              <a className="hover:underline" href="/setup">Setup</a>
              <a className="hover:underline" target="_blank" href="https://github.com/obwoj1/bruno-sist">GitHub</a>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 bg-white/70 px-6 py-3 text-center text-xs text-zinc-600 dark:border-zinc-800 dark:bg-black/60 dark:text-zinc-400">
          <span>© {new Date().getFullYear()} Bruno‑Sist</span>
        </footer>
      </body>
    </html>
  );
}
