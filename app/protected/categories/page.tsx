import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CategoriesPage() {
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
            Kategori Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ürün kategorilerinizi buradan yönetebilirsiniz.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Kategoriler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Kategori yönetimi özelliği yakında gelecek...
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 