export default function CartLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            <span className="text-gray-400">/</span>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Page Title Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="divide-y">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Product Image Skeleton */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>

                      {/* Product Info Skeleton */}
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
                        <div className="flex items-center justify-between">
                          {/* Quantity Controls Skeleton */}
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>

                          {/* Price Skeleton */}
                          <div className="text-right">
                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button Skeleton */}
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-4">
              <div className="p-6 border-b">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-6"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 