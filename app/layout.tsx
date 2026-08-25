import type { Metadata } from "next";
import "@/styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_NAME = "Project Atlas";
const SITE_DESCRIPTION = "KI-gestützter Trading-Card-Marktplatz";

// Feature 80 – Release Readiness: metadataBase fehlte (Next.js kann ohne
// sie relative Metadata-URLs – z. B. das Canonical-Handling aus Feature 72
// – nicht zu absoluten URLs auflösen) und es gab kein OpenGraph. Nutzt
// dieselbe Basis-URL-Quelle wie robots.ts/sitemap.ts/Stripe-Redirects
// (NEXT_PUBLIC_BETTER_AUTH_URL), keine neue Environment-Variable.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000"),
  // Bewusst KEIN Title-Template ("%s – Project Atlas"): jede bestehende
  // Seite setzt ihren Titel bereits als vollständigen String inkl. " –
  // Project Atlas" (z. B. "Marketplace – Project Atlas") – ein Template
  // hätte den Suffix überall verdoppelt.
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={cn("font-sans", geist.variable)}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
