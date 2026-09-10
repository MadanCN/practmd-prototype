import AppLayout from "@/components/layout/AppLayout";
import ClinicDetailScreen from "@/components/clinic-management/ClinicDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppLayout>
      <ClinicDetailScreen id={id} />
    </AppLayout>
  );
}
