import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroBannerManagement } from "@/components/hero-banner-management";

export default async function HeroBannersPage() {
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
            Hero Banner Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ana sayfa hero banner'larınızı buradan yönetebilirsiniz.
          </p>
        </div>
      </div>
      
      <HeroBannerManagement />
    </div>
  );
} 