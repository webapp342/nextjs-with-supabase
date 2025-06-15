import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Image, BarChart3, Users, ShoppingBag } from 'lucide-react';

export default function AdminDashboard() {
  const quickActions = [
    {
      title: 'Ürün Yönetimi',
      description: 'Ürünleri görüntüle, düzenle ve yeni ürün ekle',
      href: '/admin/products',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Banner Yönetimi',
      description: 'Ana sayfa banner\'larını yönet',
      href: '/admin/banners',
      icon: Image,
      color: 'bg-green-500'
    },
    {
      title: 'Kategori Yönetimi',
      description: 'Ürün kategorilerini düzenle',
      href: '/admin/categories',
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      title: 'Marka Yönetimi',
      description: 'Markaları yönet ve düzenle',
      href: '/admin/brands',
      icon: Users,
      color: 'bg-orange-500'
    },
    {
      title: 'Sipariş Yönetimi',
      description: 'Siparişleri görüntüle ve yönet',
      href: '/admin/orders',
      icon: ShoppingBag,
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">E-ticaret sitenizi yönetin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/product-upload" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Yeni Ürün Ekle</h3>
                <p className="text-sm text-gray-600 mt-1">Hızlıca yeni ürün ekleyin</p>
              </Link>
              
              <Link 
                href="/admin/banners" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Banner Oluştur</h3>
                <p className="text-sm text-gray-600 mt-1">Yeni banner tasarlayın</p>
              </Link>
              
              <Link 
                href="/" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Siteyi Görüntüle</h3>
                <p className="text-sm text-gray-600 mt-1">Ana siteye geri dönün</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 