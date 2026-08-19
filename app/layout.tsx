import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppAuthGuard from "@/app/components/AppAuthGuard";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
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
