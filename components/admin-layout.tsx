'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Image as ImageIcon, 
  Users, 
  Settings, 
  Menu, 
  X,
  Tag,
  BarChart3,
  ShoppingCart,
  Palette,
  FolderTree,
  LogOut,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/protected',
    icon: LayoutDashboard,
    description: 'Genel bakış ve istatistikler'
  },
  {
    title: 'Ürün Ekleme',
    href: '/protected/products/add',
    icon: Package,
    description: 'Yeni ürün ekleme'
  },
  {
    title: 'Ürün Düzenleme',
    href: '/protected/products/manage',
    icon: Edit,
    description: 'Mevcut ürünleri düzenleme'
  },
  {
    title: 'Banner Yönetimi',
    href: '/protected/banners',
    icon: ImageIcon,
    description: 'Ana sayfa ve kategori banner\'ları'
  },
  {
    title: 'Ana Kategori Sayfaları',
    href: '/protected/category-sections',
    icon: Palette,
    description: 'Ana kategori sayfası section\'ları'
  },
  {
    title: 'Kategoriler',
    href: '/protected/categories',
    icon: FolderTree,
    description: 'Kategori yönetimi'
  },
  {
    title: 'Markalar',
    href: '/protected/brands',
    icon: Tag,
    description: 'Marka yönetimi'
  },
  {
    title: 'Siparişler',
    href: '/protected/orders',
    icon: ShoppingCart,
    description: 'Sipariş takibi'
  },
  {
    title: 'Müşteriler',
    href: '/protected/customers',
    icon: Users,
    description: 'Müşteri yönetimi'
  },
  {
    title: 'İstatistikler',
    href: '/protected/analytics',
    icon: BarChart3,
    description: 'Satış raporları'
  },
  {
    title: 'Tema Ayarları',
    href: '/protected/theme',
    icon: Palette,
    description: 'Site görünüm ayarları'
  },
  {
    title: 'Ayarlar',
    href: '/protected/settings',
    icon: Settings,
    description: 'Genel ayarlar'
  }
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn(
                  "h-5 w-5 mr-3",
                  isActive 
                    ? "text-blue-700 dark:text-blue-300" 
                    : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                )} />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {sidebarItems.find(item => item.href === pathname)?.title || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Ayarlar
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 