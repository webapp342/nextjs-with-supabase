import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Edit } from "lucide-react";
import Link from "next/link";

export default async function ProductsPage() {
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
            Ürün İşlemleri
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ürün ekleme ve düzenleme işlemlerinizi buradan gerçekleştirebilirsiniz.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Yeni Ürün Ekleme
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Mağazanıza yeni ürün ekleyin
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/protected/products/add">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ürün Ekle
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Edit className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ürün Düzenleme
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Mevcut ürünlerinizi yönetin
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/protected/products/manage">
                <Button variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Ürünleri Yönet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 