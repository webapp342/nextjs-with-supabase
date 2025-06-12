import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductManagement } from "@/components/product-management";

export default async function ProductManagePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ürün Düzenleme
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mevcut ürünlerinizi görüntüleyin, düzenleyin ve yönetin.
          </p>
        </div>
      </div>
      
      <ProductManagement />
    </div>
  );
} 