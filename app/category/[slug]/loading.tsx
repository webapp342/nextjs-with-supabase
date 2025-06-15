import { BreadcrumbSkeleton, PageHeaderSkeleton, ProductListSkeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <div className="w-full">
      {/* Breadcrumb Skeleton */}
      <BreadcrumbSkeleton />
      
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />
      
      {/* Category Banners Skeleton */}
      <div className="px-4 py-6">
        <div className="animate-pulse">
          <div className="h-32 md:h-48 bg-gray-200 rounded-lg mb-4"></div>
        </div>
      </div>
      
      {/* Products Grid Skeleton */}
      <ProductListSkeleton count={12} />
    </div>
  );
} 