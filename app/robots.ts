import type { MetadataRoute } from "next";

/**
 * Feature 79 – Release Readiness: robots.txt fehlte komplett. Nutzt die
 * bereits vorhandene Next.js-Metadata-Route-Konvention (keine neue
 * Architektur) und dieselbe Basis-URL-Quelle wie der bestehende Checkout
 * (NEXT_PUBLIC_BETTER_AUTH_URL, siehe services/stripe/createCheckoutSession.ts).
 * Sperrt ausschließlich Account-/Checkout-/Admin-/API-Bereiche – der
 * öffentliche Katalog/Marketplace bleibt crawlbar (siehe Feature 72
 * Canonical-Handling). Wichtig: NUR die konkreten privaten /seller/*-Pfade
 * werden gesperrt (nicht "/seller/" als Präfix), da /seller/[id] die
 * bewusst öffentliche Verkäuferprofilseite ist (Feature 76) – ein
 * pauschales "/seller/" hätte diese fälschlich blockiert.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/cart",
        "/checkout",
        "/checkout/",
        "/dashboard",
        "/messages",
        "/messages/",
        "/orders",
        "/orders/",
        "/my-collection",
        "/my-following",
        "/my-notifications",
        "/my-portfolio",
        "/my-price-alerts",
        "/my-wishlist",
        // "$" verankert am Pfadende (Google/gängige Crawler-Erweiterung des
        // robots.txt-Standards) – blockt NUR exakt /seller (Dashboard-Root),
        // kein Präfix-Match, der sonst auch /seller/[id] träfe.
        "/seller$",
        "/seller/new",
        "/seller/new-listing",
        "/seller/orders",
        "/seller/listings",
        "/seller/analytics",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
