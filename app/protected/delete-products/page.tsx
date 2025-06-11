'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toPersianNumber, truncateText } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  brand: string;
  user_id: string;
}

export default function DeleteProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    console.log('Attempting to fetch products...');
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Supabase fetch products error:', error.message);
      setError(error.message);
      setLoading(false);
      return;
    } else {
      console.log('Supabase fetch products success. Fetched products:', data);
    }

    setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [supabase]);

  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Fetch product to get image URLs
        console.log(`Attempting to fetch product with ID: ${productId}`);
        const { data: productData, error: fetchError } = await supabase
          .from('products')
          .select('id') // Changed from 'image_urls' to 'id'
          .eq('id', productId)
          .single();

        if (fetchError) {
          console.error('Supabase fetch product error:', fetchError.message);
          throw fetchError;
        } else {
          console.log('Supabase fetch product success:', productData);
        }

        // Delete product from database
        console.log(`Attempting to delete product from database with ID: ${productId}`);
        const { error: deleteProductError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (deleteProductError) {
          console.error('Supabase delete product error:', deleteProductError.message);
          console.error('Supabase delete product details:', deleteProductError); // Added for debugging
          throw deleteProductError;
        } else {
          console.log('Supabase delete product success.');
          console.log(`Product with ID ${productId} successfully deleted from database.`); // Added for debugging
        }

        alert('Product and associated data deleted successfully!');
        fetchProducts(); // Re-fetch products after deletion
      } catch (error: any) {
        alert(`Error deleting product: ${error.message}`);
        console.error('Deletion error:', error);
      }
    }
  };

  if (loading) {
    return <p>Loading products...</p>;
  }

  if (error) {
    return <p>Error loading products: {error}</p>;
  }

  if (products.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="w-[95%] mx-auto py-8"> {/* Removed key prop */}
      <h1 className="text-2xl font-bold mb-6">Delete Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <div className="relative w-full h-48">
              {product.image_urls && product.image_urls.length > 0 && (
                <Image src={product.image_urls[0]} alt={product.name} className="absolute w-full h-full object-cover rounded-t-md" width={500} height={500} unoptimized />
              )}
            </div>
            <CardContent className="px-3 pt-2 pb-0">
              <CardDescription className="font-sans text-xs text-gray-500 text-right">{product.brand}</CardDescription>
              <CardTitle className="font-sans text-sm font-medium text-right">{truncateText(product.name, 2)}</CardTitle>
            </CardContent>
            <div className="px-3 pb-2">
              <p className="font-sans text-xs text-gray-600 text-right leading-tight">
                {truncateText(product.description, 2)}
              </p>
            </div>
            <div className="flex px-3 pb-3 mt-auto justify-between items-center">
              <p className="font-sans text-left"> ؋ &lrm; <span className="font-medium">{toPersianNumber(product.price)}</span></p>
              <Button variant="destructive" onClick={() => handleDelete(product.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}