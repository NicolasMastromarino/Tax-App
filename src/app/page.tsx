import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/landing-page";

const description =
  "Simple bookkeeping and accurate tax estimates for freelancers and service-based businesses. Track income and expenses, then see your self-employment tax, QBI deduction, and quarterly payments — sourced from the IRS. Free to start.";

export const metadata: Metadata = {
  title: {
    absolute: "Ten Minute Books — Bookkeeping and Taxes, Without the Dread",
  },
  description,
  openGraph: {
    title: "Ten Minute Books — Bookkeeping and Taxes, Without the Dread",
    description,
    siteName: "Ten Minute Books",
    type: "website",
    images: [{ url: "/marketing/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ten Minute Books — Bookkeeping and Taxes, Without the Dread",
    description,
    images: ["/marketing/og-image.png"],
  },
};

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <LandingPage />;
}
