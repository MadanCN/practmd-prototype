import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import MessageInbox from "@/components/provider/MessageInbox";

export default function ProviderInternalMessagesPage() {
  return (
    <ProviderLayout>
      <MessageInbox channel="internal" />
    </ProviderLayout>
  );
}
