import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ModelStatusBadge from "@/app/components/ModelStatusBadge";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brain Center",
  description: "AI-powered QA Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        <nav className="bg-slate-900 border-b-2 border-indigo-500 px-6 sm:px-10 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md text-white">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 font-extrabold text-white text-lg hover:text-indigo-300 transition-colors">
              <span className="bg-indigo-600 text-white text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg shadow-xs">QA</span>
              <span>Brain Center</span>
            </a>
            <span className="text-slate-700 font-bold">|</span>
            <span className="text-xs text-indigo-200 font-mono font-bold hidden sm:inline-block">AI-powered ISTQB QA Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/configs"
              className="text-xs font-extrabold text-indigo-100 hover:text-white bg-slate-800 hover:bg-slate-700 border-2 border-indigo-500/40 px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              System Instructions
            </a>
            <ModelStatusBadge />
          </div>
        </nav>
        <main className="max-w-[1700px] mx-auto px-6 sm:px-10 py-8">{children}</main>
      </body>
    </html>
  );
}
