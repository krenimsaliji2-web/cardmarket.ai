import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getCart } from "@/services/cart/getCart";
import { getConversations } from "@/services/messages/getConversations";

import { SiteHeaderNav } from "./site-header-nav";

/**
 * Globale Navigation (Feature 84). Server Component: holt die Session GENAU
 * EINMAL pro Request (bestehender `auth.api.getSession()`-Aufruf, exakt wie
 * in jeder anderen Page dieses Projekts) – die einzelnen Pages machen
 * weiterhin ihre eigenen, unveränderten Auth-Checks, dieser Aufruf hier
 * kommt ausschließlich für die Navigationsanzeige hinzu, keine Änderung an
 * bestehenden Seiten nötig.
 *
 * Warenkorb-Anzahl und ungelesene Nachrichten nutzen ausschließlich die
 * bereits vorhandenen Services getCart()/getConversations() (liefert pro
 * Conversation bereits `unreadCount`, siehe dort) – keine neue Query, keine
 * neue Infrastruktur. Rolle kommt direkt vom Session-Objekt
 * (`user.role`, additionalField, siehe lib/auth/auth.ts), keine zusätzliche
 * DB-Abfrage nötig (anders als bei sicherheitskritischen Admin-Aktionen,
 * die role bewusst nochmal frisch aus der DB lesen – hier geht es nur um
 * Anzeige, die eigentlichen /admin-Seiten prüfen weiterhin selbst serverseitig).
 */
export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return <SiteHeaderNav isLoggedIn={false} isAdmin={false} cartCount={0} unreadCount={0} />;
  }

  const [cart, conversations] = await Promise.all([
    getCart(session.user.id),
    getConversations(session.user.id),
  ]);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const unreadCount = conversations.items.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <SiteHeaderNav
      isLoggedIn
      isAdmin={session.user.role === "ADMIN"}
      cartCount={cartCount}
      unreadCount={unreadCount}
    />
  );
}
