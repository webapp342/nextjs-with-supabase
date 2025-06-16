import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLayout } from "@/components/admin-layout";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin/seller
  const userMetadata = data.user.user_metadata;
  if (!userMetadata?.['user_type'] || (userMetadata['user_type'] !== 'seller' && userMetadata['user_type'] !== 'admin')) {
    redirect("/?error=access_denied");
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}
