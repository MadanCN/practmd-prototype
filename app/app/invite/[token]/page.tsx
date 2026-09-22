import InviteLanding from "@/components/provider-staff/InviteLanding";

export const metadata = { title: "Invitation" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteLanding token={token} />;
}
