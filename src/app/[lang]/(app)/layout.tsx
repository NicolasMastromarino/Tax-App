import { requireBusiness } from "@/lib/current-business";
import { hasActiveSubscription } from "@/lib/data/subscription";
import { Sidebar } from "@/components/nav/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, business } = await requireBusiness();

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar
        businessName={business.businessName}
        subscribed={hasActiveSubscription(business, session.user?.email)}
      />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
