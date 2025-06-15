import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
      {...props}
    />
  );
}

// Product Card Skeleton
function ProductCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeConfig = {
    sm: { container: 'min-w-[160px] max-w-[160px]', image: 'h-32', padding: 'p-3' },
    md: { container: 'min-w-[200px] max-w-[200px]', image: 'h-48', padding: 'p-4' },
    lg: { container: 'min-w-[240px] max-w-[240px]', image: 'h-56', padding: 'p-5' }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div className={cn(config.container, "bg-white rounded-xl border border-gray-200 overflow-hidden")}>
      <Skeleton className={cn("w-full", config.image)} />
      <div className={cn(config.padding, "space-y-2")}>
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-2">
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Page Header Skeleton
function PageHeaderSkeleton() {
  return (
    <div className="px-4 py-6 space-y-4">
      <Skeleton className="h-8 w-1/3 ml-auto" />
      <Skeleton className="h-4 w-2/3 ml-auto" />
    </div>
  );
}

// Breadcrumb Skeleton
function BreadcrumbSkeleton() {
  return (
    <nav className="px-4 py-2">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Skeleton className="h-4 w-16" />
        <span className="mx-2 text-gray-400">/</span>
        <Skeleton className="h-4 w-20" />
        <span className="mx-2 text-gray-400">/</span>
        <Skeleton className="h-4 w-24" />
      </div>
    </nav>
  );
}

// Product List Skeleton
function ProductListSkeleton({ count = 8, size = 'md' }: { count?: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} size={size} />
      ))}
    </div>
  );
}

// Horizontal Scroll Skeleton (for sections like bestsellers)
function HorizontalScrollSkeleton({ count = 4, size = 'md' }: { count?: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex gap-4 px-4 overflow-x-auto pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} size={size} />
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  ProductCardSkeleton, 
  PageHeaderSkeleton, 
  BreadcrumbSkeleton, 
  ProductListSkeleton,
  HorizontalScrollSkeleton 
}; 