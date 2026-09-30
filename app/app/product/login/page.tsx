import LoginForm from "@/components/product/LoginForm";
import SetupNotice from "@/components/product/SetupNotice";
import { isSupabaseConfigured } from "@/lib/product/supabase/env";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-pm-navy dark:text-white">
            Pract<span className="text-pm-teal">MD</span>
          </p>
          <h1 className="mt-2 text-lg font-semibold">Roadmap and priorities</h1>
          <p className="mt-1 text-sm text-pm-muted">Sign in with your work email. We&apos;ll email you a sign-in link.</p>
        </div>
        {isSupabaseConfigured ? <LoginForm next={next} initialError={error} /> : <SetupNotice />}
      </div>
    </main>
  );
}
