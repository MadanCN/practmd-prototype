import { redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { getProductSession } from "@/lib/product/session";

export default async function NoAccessPage() {
  const session = await getProductSession();
  if (session.status === "signed_out" || session.status === "unconfigured") redirect("/product/login");
  if (session.status === "ok") redirect("/product/priorities");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-pm-border bg-pm-card p-8 text-center">
        <ShieldX className="mx-auto h-10 w-10 text-pm-warning" />
        <h1 className="mt-3 text-lg font-semibold">You don&apos;t have access</h1>
        <p className="mt-2 text-sm text-pm-muted">
          <span className="font-medium text-pm-text">{session.email}</span> isn&apos;t on the PractMD product team list. Ask an admin to add
          you, then sign in again.
        </p>
        <form action="/product/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm font-medium text-pm-link hover:underline">
            Sign in with a different email
          </button>
        </form>
      </div>
    </main>
  );
}
