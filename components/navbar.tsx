'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from '@/components/mobile-menu';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full bg-background border-b border-border shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Icons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ShoppingCart size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground" asChild>
              <Link href="/auth/login">
                <User size={20} />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Search size={20} />
            </Button>
          </div>

          {/* Right side - Logo next to Menu */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <div 
                className="text-pink-600 text-2xl font-bold"
                style={{ fontFamily: 'Far Akbar, sans-serif' }}
              >
                <h1>
                شاهبانو
                </h1>
                
              </div>
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
} 