'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, LogOut, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from '@/components/mobile-menu';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { useCart } from '@/contexts/cart-context';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { cartItemCount } = useCart();
  const supabase = createClient();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCartClick = () => {
    if (user) {
      router.push('/cart');
    } else {
      router.push('/auth/login?redirect=/cart');
    }
  };

  const handleUserClick = () => {
    if (user) {
      setShowUserMenu(!showUserMenu);
    } else {
      router.push('/auth/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-background border-b border-border shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Icons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground relative"
              onClick={handleCartClick}
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground"
                onClick={handleUserClick}
              >
                <User size={20} />
              </Button>
              
              {/* User Dropdown Menu */}
              {user && showUserMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">{user.email}</p>
                  </div>
                  
                  <Link 
                    href="/orders" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Package className="w-4 h-4 ml-2" />
                    سفارش‌های من
                  </Link>
                  
                  <Link 
                    href="/protected" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4 ml-2" />
                    تنظیمات حساب
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    خروج
                  </button>
                </div>
              )}
            </div>
            
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