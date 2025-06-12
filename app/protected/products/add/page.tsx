import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalProductUploadForm } from "@/components/professional-product-upload-form";

export default async function ProductAddPage() {
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
            Yeni Ürün Ekleme
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mağazanıza yeni ürün eklemek için aşağıdaki formu doldurun.
          </p>
        </div>
      </div>
      
      <ProfessionalProductUploadForm />
    </div>
  );
} 