import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppAuthGuard from "@/app/components/AppAuthGuard";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brain Center",
  description: "Trung tâm lưu trữ và trợ lý kiểm thử ISTQB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-slate-50 text-slate-900 antialiased font-sans"
        suppressHydrationWarning
      >
        <AppAuthGuard>{children}</AppAuthGuard>
      </body>
    </html>
  );
}
