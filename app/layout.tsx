import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import AppAuthGuard from "@/app/components/AppAuthGuard";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
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
      className={`${roboto.variable} h-full`}
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
