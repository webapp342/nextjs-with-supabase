import { AdminLayout } from "@/components/admin-layout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
          {children}
    </AdminLayout>
  );
}
