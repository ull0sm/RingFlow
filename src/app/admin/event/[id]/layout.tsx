import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-on-surface w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
