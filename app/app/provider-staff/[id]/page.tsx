import AppLayout from "@/components/layout/AppLayout";
import ProviderDetailScreen from "@/components/provider-staff/ProviderDetail";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const on = (k: string) => sp[k] === "1";
  return (
    <AppLayout>
      <ProviderDetailScreen id={id} flash={{ created: on("created"), saved: on("saved"), reverify: on("reverify"), invited: on("invited") }} />
    </AppLayout>
  );
}
