import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "./components/AuthGuard";
import Navbar from "./components/Navbar";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-cormorant' });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Shruti Jewellers",
  description: "Personal business management app for Shruti Jewellers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthGuard>
          <div className="flex h-screen overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
