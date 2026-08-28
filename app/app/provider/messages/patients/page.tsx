import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import MessageInbox from "@/components/provider/MessageInbox";

export default function ProviderPatientMessagesPage() {
  return (
    <ProviderLayout>
      <MessageInbox channel="patient" />
    </ProviderLayout>
  );
}
