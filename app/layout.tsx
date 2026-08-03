import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AppAuthGuard from "@/app/components/AppAuthGuard";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brain Center",
  description: "Trung tâm Lưu trữ & Trợ lý Kiểm thử ISTQB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        <AppAuthGuard>{children}</AppAuthGuard>
      </body>
    </html>
  );
}
