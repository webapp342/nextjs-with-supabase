import { PageHeaderSkeleton, ProductListSkeleton } from '@/components/ui/skeleton';

export default function BrandLoading() {
  return (
    <div className="w-full py-6 px-2">
      {/* Brand Header Skeleton */}
      <PageHeaderSkeleton />
      
      {/* Sort and Filter Controls Skeleton */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="animate-pulse">
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Products Grid Skeleton */}
      <ProductListSkeleton count={12} />
    </div>
  );
} 