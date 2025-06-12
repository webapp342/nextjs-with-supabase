'use client';

import { usePathname } from "next/navigation";
import { TopBanner } from "@/components/top-banner";
import { Navbar } from "@/components/navbar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Protected sayfalarında TopBanner ve Navbar'ı gizle
  const isProtectedRoute = pathname?.startsWith('/protected');

  if (isProtectedRoute) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <TopBanner />
      
      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 