import { requireBusiness } from "@/lib/current-business";
import { getSubscriptionSummary } from "@/lib/data/subscription";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const { session, business } = await requireBusiness();
  return (
    <SettingsClient
      business={business}
      subscription={getSubscriptionSummary(business, session.user?.email)}
      email={session.user?.email ?? ""}
    />
  );
}
