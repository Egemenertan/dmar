import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased `}>
        <AuthProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
