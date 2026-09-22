import AppLayout from "@/components/layout/AppLayout";
import AddEditProviderScreen from "@/components/provider-staff/AddEditProvider";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppLayout>
      <AddEditProviderScreen providerId={id} />
    </AppLayout>
  );
}
