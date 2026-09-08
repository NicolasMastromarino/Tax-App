import { requireBusiness } from "@/lib/current-business";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const { business } = await requireBusiness();
  return <SettingsClient business={business} />;
}
