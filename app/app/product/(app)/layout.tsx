import { redirect } from "next/navigation";
import ProductTopBar from "@/components/product/ProductTopBar";
import SetupNotice from "@/components/product/SetupNotice";
import { SessionProvider } from "@/components/product/SessionContext";
import { PresenceProvider } from "@/components/product/Presence";
import { getProductSession } from "@/lib/product/session";

// Reading the session cookie makes this segment render per request.
export default async function ProductAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getProductSession();

  if (session.status === "unconfigured") {
    return (
      <>
        <ProductTopBar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
          <SetupNotice />
        </main>
      </>
    );
  }
  if (session.status === "signed_out") redirect("/product/login");
  if (session.status === "no_access") redirect("/product/no-access");

  return (
    <SessionProvider user={session.user} team={session.team}>
      <PresenceProvider>
        <ProductTopBar signedIn />
        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-5 sm:px-6">{children}</main>
      </PresenceProvider>
    </SessionProvider>
  );
}
