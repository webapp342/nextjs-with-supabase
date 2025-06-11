import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProfessionalProductUploadForm } from "@/components/professional-product-upload-form";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <Breadcrumb />
        <div className="py-4">
          <ProfessionalProductUploadForm />
        </div>
      </div>
    </div>
  );
}
