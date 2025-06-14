import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ClientLayout } from "@/components/client-layout";
import { CartProvider } from "@/contexts/cart-context";
import StartupLogger from "@/components/StartupLogger";
import "./globals.css";

const defaultUrl = process.env['VERCEL_URL']
  ? `https://${process.env['VERCEL_URL']}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "E-Ticaret Platformu",
  description: "Modern e-ticaret platformu - Next.js ve Supabase ile",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <StartupLogger />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
