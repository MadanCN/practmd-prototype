import AppLayout from "@/components/layout/AppLayout";
import ProviderDetailScreen from "@/components/provider-staff/ProviderDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppLayout>
      <ProviderDetailScreen id={id} />
    </AppLayout>
  );
}
