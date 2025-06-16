import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductEditForm } from "@/components/product-edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Fetch the product to edit
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (productError || !product) {
    redirect("/protected/products/manage");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ürün Düzenleme
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            "{product.name}" ürününü düzenleyin.
          </p>
        </div>
      </div>
      
      <ProductEditForm product={product} />
    </div>
  );
} 