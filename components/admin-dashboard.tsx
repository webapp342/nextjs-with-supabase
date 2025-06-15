'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  Package, 
  TrendingUp, 
  ArrowUpRight,
  Activity,
  Image as ImageIcon,
  Tag,
  Star,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalProducts: number;
  featuredProducts: number;
  activeProducts: number;
  totalBanners: number;
  totalBrands: number;
  totalOrders: number;
  pendingOrders: number;
}

interface RecentActivity {
  id: string;
  type: 'product' | 'order' | 'customer';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    featuredProducts: 0,
    activeProducts: 0,
    totalBanners: 0,
    totalBrands: 0,
    totalOrders: 0,
    pendingOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setRecentActivity([]); // Reset activity

      // Fetch products stats
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, is_featured, is_active, price, created_at, name')
        .limit(1000);

      // Fetch orders stats
      const { data: orders, error: ordersError } = await supabase
        .from('simple_orders')
        .select('id, status, created_at, customer_name')
        .limit(1000);

      // Fetch banners count
      const { data: banners, error: bannersError } = await supabase
        .from('category_banners')
        .select('id')
        .limit(1000);

      // Fetch brands count
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id')
        .limit(1000);

      if (products && !productsError) {
        const totalProducts = products.length;
        const featuredProducts = products.filter(p => p.is_featured).length;
        const activeProducts = products.filter(p => p.is_active).length;

        setStats(prev => ({
          ...prev,
          totalProducts,
          featuredProducts,
          activeProducts
        }));

        // Create recent activity from products
        const recentProducts = products
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
          .map(product => ({
            id: product.id,
            type: 'product' as const,
            title: 'Yeni Ürün Eklendi',
            description: product.name,
            timestamp: product.created_at,
            status: product.is_active ? 'Aktif' : 'Pasif'
          }));

        setRecentActivity(prev => [...prev, ...recentProducts]);
      }

      if (orders && !ordersError) {
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        setStats(prev => ({
          ...prev,
          totalOrders,
          pendingOrders
        }));

        // Create recent activity from orders
        const recentOrders = orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 2)
          .map(order => ({
            id: order.id,
            type: 'order' as const,
            title: 'Yeni Sipariş',
            description: `${order.customer_name} tarafından`,
            timestamp: order.created_at,
            status: order.status === 'pending' ? 'Bekliyor' : 'Tamamlandı'
          }));

        setRecentActivity(prev => [...prev, ...recentOrders]);
      }

      if (banners && !bannersError) {
        setStats(prev => ({ ...prev, totalBanners: banners.length }));
      }

      if (brands && !brandsError) {
        setStats(prev => ({ ...prev, totalBrands: brands.length }));
      }

    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Sipariş Yönetimi',
      description: 'Siparişleri görüntüle ve yönet',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Yeni Ürün Ekle',
      description: 'Hızlı ürün ekleme',
      href: '/protected/products/add',
      icon: Package,
      color: 'bg-green-500'
    },
    {
      title: 'Banner Yönet',
      description: 'Ana sayfa banner\'ları',
      href: '/protected/banners',
      icon: ImageIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'En İyi Markalar',
      description: 'Top markalar yönetimi',
      href: '/protected/top-brands',
      icon: Star,
      color: 'bg-yellow-500'
    },
    {
      title: 'Kategori Ekle',
      description: 'Yeni kategori oluştur',
      href: '/protected/categories',
      icon: Tag,
      color: 'bg-orange-500'
    },
    {
      title: 'İstatistikleri Gör',
      description: 'Detaylı raporlar',
      href: '/protected/analytics',
      icon: TrendingUp,
      color: 'bg-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Ürün
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.activeProducts} aktif, {stats.featuredProducts} öne çıkan
              </p>
              <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Banner
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBanners}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Marka
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBrands}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Hızlı İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className={`p-1 rounded-full ${activity.type === 'order' ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                      {activity.type === 'order' ? (
                        <ShoppingCart className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {activity.status && (
                      <Badge variant={activity.status === 'Aktif' ? 'default' : 'secondary'} className="text-xs">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Henüz aktivite bulunmuyor
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Sipariş
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bekleyen Sipariş
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingOrders}
                </p>
              </div>
              <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sistem Durumu
                </p>
                <p className="text-lg font-bold text-green-600">
                  Çevrimiçi
                </p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 