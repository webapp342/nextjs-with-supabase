'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string;
  level: number;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      setLoading(true);
      const pathSegments = pathname.split('/').filter(segment => segment !== '');
      const items: BreadcrumbItem[] = [];

      try {
        // Handle different route patterns
        if (pathSegments.length === 0) {
          // Home page
          setBreadcrumbs(items);
          return;
        }

        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i];
          const currentPath = '/' + pathSegments.slice(0, i + 1).join('/');

          switch (segment) {
            case 'category':
              // Handle nested category paths like /category/makeup/foundation
              const categorySegments = pathSegments.slice(i + 1);
              
              if (categorySegments.length > 0) {
                // Build category hierarchy
                let currentParentId = null;
                
                for (let j = 0; j < categorySegments.length; j++) {
                  const categorySlug = categorySegments[j];
                  
                  // Find category with matching slug and parent
                  let categoryQuery = supabase
                    .from('categories_new')
                    .select('*')
                    .eq('slug', categorySlug)
                    .eq('is_active', true);
                  
                  if (currentParentId) {
                    categoryQuery = categoryQuery.eq('parent_id', currentParentId);
                  } else {
                    categoryQuery = categoryQuery.is('parent_id', null);
                  }
                  
                  const { data: category } = await categoryQuery.single();
                  
                  if (category) {
                    const categoryPath = '/category/' + categorySegments.slice(0, j + 1).join('/');
                    items.push({
                      label: category.name,
                      href: categoryPath
                    });
                    currentParentId = category.id;
                  }
                }
              }
              
              // Skip all category segments as we've processed them
              i += categorySegments.length;
              break;

            case 'product-details':
              // Get product info from query params
              const productId = searchParams.get('id');
              
              if (productId) {
                const { data: product } = await supabase
                  .from('products')
                  .select('id, name, category_id')
                  .eq('id', productId)
                  .single();

                if (product) {
                  // Get category hierarchy for this product
                  const categoryHierarchy = await getCategoryHierarchy(product.category_id);
                  
                  // Add category breadcrumbs
                  for (const category of categoryHierarchy) {
                    const categoryPath = getCategoryPath(categoryHierarchy, category.id);
                    items.push({
                      label: category.name,
                      href: categoryPath
                    });
                  }
                  
                  // Add product as final breadcrumb
                  items.push({
                    label: product.name,
                    href: currentPath
                  });
                }
              } else {
                items.push({
                  label: 'Ürün Detayı',
                  href: currentPath
                });
              }
              break;

            case 'auth':
              items.push({
                label: 'Giriş / Kayıt',
                href: '/auth'
              });
              
              if (i + 1 < pathSegments.length) {
                const authType = pathSegments[i + 1];
                const authLabels: { [key: string]: string } = {
                  'login': 'Giriş Yap',
                  'sign-up': 'Kayıt Ol',
                  'forgot-password': 'Şifremi Unuttum',
                  'sign-up-success': 'Kayıt Başarılı'
                };
                
                if (authLabels[authType]) {
                  items.push({
                    label: authLabels[authType],
                    href: currentPath
                  });
                  i++; // Skip the next segment
                }
              }
              break;

            case 'protected':
              items.push({
                label: 'Satıcı Paneli',
                href: '/protected'
              });
              
              if (i + 1 < pathSegments.length) {
                const protectedType = pathSegments[i + 1];
                const protectedLabels: { [key: string]: string } = {
                  'delete-products': 'Ürün Yönetimi'
                };
                
                if (protectedLabels[protectedType]) {
                  items.push({
                    label: protectedLabels[protectedType],
                    href: currentPath
                  });
                  i++; // Skip the next segment
                }
              }
              break;

            case 'search':
              items.push({
                label: 'Arama Sonuçları',
                href: currentPath
              });
              break;

            case 'brand':
              if (i + 1 < pathSegments.length) {
                const brandSlug = pathSegments[i + 1];
                
                const { data: brand } = await supabase
                  .from('brands')
                  .select('*')
                  .eq('slug', brandSlug)
                  .eq('is_active', true)
                  .single();

                if (brand) {
                  items.push({
                    label: `${brand.name} Ürünleri`,
                    href: `/brand/${brand.slug}`
                  });
                }
                i++; // Skip the next segment
              }
              break;

            case 'cart':
              items.push({
                label: 'Sepetim',
                href: '/cart'
              });
              break;

            case 'checkout':
              items.push({
                label: 'Ödeme',
                href: '/checkout'
              });
              break;

            case 'profile':
              items.push({
                label: 'Profilim',
                href: '/profile'
              });
              break;

            case 'orders':
              items.push({
                label: 'Siparişlerim',
                href: '/orders'
              });
              break;

            case 'wishlist':
              items.push({
                label: 'Favorilerim',
                href: '/wishlist'
              });
              break;

            default:
              // Generic fallback for unknown routes
              const formattedLabel = segment
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              items.push({
                label: formattedLabel,
                href: currentPath
              });
              break;
          }
        }

      } catch (error) {
        console.error('Error generating breadcrumbs:', error);
      } finally {
        setBreadcrumbs(items);
        setLoading(false);
      }
    };

    // Helper function to get category hierarchy
    const getCategoryHierarchy = async (categoryId: string): Promise<Category[]> => {
      const hierarchy: Category[] = [];
      let currentCategoryId = categoryId;

      while (currentCategoryId) {
        const { data: category } = await supabase
          .from('categories_new')
          .select('*')
          .eq('id', currentCategoryId)
          .single();

        if (category) {
          hierarchy.unshift(category); // Add to beginning to maintain order
          currentCategoryId = category.parent_id;
        } else {
          break;
        }
      }

      return hierarchy;
    };

    // Helper function to build category path
    const getCategoryPath = (hierarchy: Category[], targetCategoryId: string): string => {
      const targetIndex = hierarchy.findIndex(cat => cat.id === targetCategoryId);
      if (targetIndex === -1) return '/';
      
      const pathSegments = hierarchy.slice(0, targetIndex + 1).map(cat => cat.slug);
      return '/category/' + pathSegments.join('/');
    };

    generateBreadcrumbs();
  }, [pathname, searchParams, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-end space-x-2 py-2 text-sm text-muted-foreground" dir="rtl">
        <div className="animate-pulse h-4 w-20 bg-muted rounded"></div>
        <ChevronLeft className="h-4 w-4" />
        <div className="animate-pulse h-4 w-24 bg-muted rounded"></div>
      </div>
    );
  }

  if (breadcrumbs.length === 0) {
    return null; // Don't show breadcrumbs if empty
  }

  return (
    <nav className="flex items-center justify-end py-2 text-sm" aria-label="Breadcrumb" dir="rtl">
      <ol className="flex items-center space-x-1 space-x-reverse">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronLeft className="h-4 w-4 text-muted-foreground mx-1" />
            )}
            
            {index === breadcrumbs.length - 1 ? (
              // Current page - not clickable
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            ) : (
              // Clickable breadcrumb
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Structured data for SEO
export function BreadcrumbJsonLd({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${item.href}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 