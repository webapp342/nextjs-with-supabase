'use client';

import Image from 'next/image';
import Link from 'next/link';
import { toPersianNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand?: string;
  brand_name?: string;
  is_bestseller?: boolean;
  is_recommended?: boolean;
  is_new?: boolean;
  sales_count?: number;
  [key: string]: any; // Allow other properties
}

interface ProductCardProps {
  product: Product;
  showBadges?: boolean;
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductCard({ 
  product, 
  showBadges = false, 
  className = '',
  imageClassName = '',
  size = 'md'
}: ProductCardProps) {
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  const brandName = product.brand_name || product.brand || '';

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'min-w-[160px] max-w-[160px]',
      image: 'h-32',
      padding: 'p-3',
      text: 'text-xs',
      title: 'text-xs',
      price: 'text-sm'
    },
    md: {
      container: 'min-w-[200px] max-w-[200px]',
      image: 'h-48',
      padding: 'p-4',
      text: 'text-xs',
      title: 'text-sm',
      price: 'text-lg'
    },
    lg: {
      container: 'min-w-[240px] max-w-[240px]',
      image: 'h-56',
      padding: 'p-5',
      text: 'text-sm',
      title: 'text-base',
      price: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Generate product URL
  const productUrl = product.slug 
    ? `/product/${product.slug}` 
    : `/product-details?id=${product.id}`;

  return (
    <Link 
      href={productUrl}
      className={cn(
        config.container,
        "bg-white rounded-xl border border-gray-300 hover:border-gray-400 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md",
        className
      )}
    >
      {/* Product Image */}
      <div className={cn("relative w-full bg-gray-50", config.image, imageClassName)}>
        {product.image_urls && product.image_urls.length > 0 && product.image_urls[0] ? (
          <Image 
            src={product.image_urls[0]} 
            alt={product.name} 
            width={300}
            height={300}
            className="w-full h-auto object-contain rounded-lg"
            unoptimized
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">تصویر موجود نیست</span>
          </div>
        )}

        {/* Badges */}
        {showBadges && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_bestseller && (
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                🔥 پرفروش
              </div>
            )}
            {product.is_recommended && (
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-bold">
                ⭐ پیشنهادی
              </div>
            )}
            {product.is_new && (
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                ✨ جدید
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={cn(config.padding, "space-y-2")}>
        {/* Brand */}
        {brandName && (
          <div className={cn(config.text, "text-gray-400 text-right font-lalezar")}>
            {brandName}
          </div>
        )}

        {/* Product Name - Fixed RTL text truncation */}
        <h3 className={cn(
          config.title,
          "text-right leading-[1.3] text-gray-800 font-lalezar"
        )}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          height: '2.6em',
          lineHeight: '1.3em',
          direction: 'rtl',
          textAlign: 'right'
        }}>
          {product.name}
        </h3>

        {/* Price Section */}
        {hasDiscount ? (
          <div className="pt-4">
            <div className="flex items-center gap-3">
              {/* Discount Badge */}
              <div className="bg-red-500 text-white text-sm px-2 py-1 rounded font-far-akbar">
                {toPersianNumber(discountPercentage)}%
              </div>
              
              {/* Price Stack */}
              <div className="flex flex-col">
                {/* Original Price - no symbol */}
                <div className="text-sm text-gray-400 line-through font-far-akbar">
                  <span className="text-left">{toPersianNumber(product.compare_price!.toLocaleString())}</span>
                </div>
                {/* Sale Price - symbol on left with &lrm; */}
                <div className={cn(config.price, "font-bold font-far-akbar")}>
                  <span className="text-left">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex items-end min-h-[44px]">
              <div className={cn(config.price, "font-bold font-far-akbar")}>
                <span className="text-left">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
} 