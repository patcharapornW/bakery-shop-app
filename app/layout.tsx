import type { Metadata } from "next";
import { Mali } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "@/components/AlertProvider";

// ✅ 1. Import Navbar
import { Navbar } from "@/components/Navbar";
import { BottomNavBar } from "@/components/BottomNavBar";

const mali = Mali({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mali",
});

export const metadata: Metadata = {
  title: "Baan Kanom",
  description: "Bakery Shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={mali.variable}>
        <AlertProvider>
          <Navbar />
          <main className="pb-16 md:pb-0">{children}</main>
          <BottomNavBar />
        </AlertProvider>
      </body>
    </html>
  );
}
