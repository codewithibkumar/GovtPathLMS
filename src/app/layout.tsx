import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GovPath Academy — Crack SSC, Banking, UPSC & Board Exams",
  description:
    "Online courses for Indian government job aspirants (Class 9–12) and graduates. Learn from expert mentors, anytime, anywhere.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} GovPath Academy. Built for India&apos;s aspirants.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
