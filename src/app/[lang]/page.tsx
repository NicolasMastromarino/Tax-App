import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/landing-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { absoluteUrl, localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { title, description } = dict.seo.home;
  return {
    title: { absolute: title },
    description,
    alternates: localizedAlternates(locale, "/"),
    openGraph: {
      title,
      description,
      siteName: "Bookkeeply",
      type: "website",
      locale: locale === "es" ? "es_US" : "en_US",
      url: localizedAlternates(locale, "/").canonical as string,
      images: [{ url: "/marketing/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/marketing/og-image.png"],
    },
  };
}

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const url = absoluteUrl(locale, "/");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${url}#organization`,
              name: "Bookkeeply",
              url,
              email: "support@bookkeeply.me",
            },
            {
              "@type": "WebSite",
              "@id": `${url}#website`,
              name: "Bookkeeply",
              url,
              inLanguage: locale,
              description: dict.seo.home.description,
              publisher: { "@id": `${url}#organization` },
            },
          ],
        }}
      />
      <LandingPage />
    </>
  );
}
