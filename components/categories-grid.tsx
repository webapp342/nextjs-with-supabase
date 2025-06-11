'use client';

import { categories } from '@/lib/categories';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export function CategoriesGrid() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6 text-right">دسته‌بندی‌ها</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group"
          >
            <Card className="p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <span className="text-sm font-medium text-card-foreground leading-tight">
                  {category.name}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 