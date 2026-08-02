import { ShippingCarrier } from "@/prisma/generated/prisma/client";

/**
 * Liefert die öffentliche Tracking-URL des jeweiligen Versanddienstes für
 * eine Trackingnummer – reine, DB-freie Funktion (kein API-Aufruf, kein
 * Live-Status, siehe Ticket "KEIN API Tracking / Live Status"). Die
 * URL-Formate sind die öffentlich dokumentierten Tracking-Link-Muster der
 * jeweiligen Anbieter. `OTHER` hat kein bekanntes Format und liefert
 * bewusst `null` (die UI zeigt dann nur die Trackingnummer als Text).
 */
export function getTrackingUrl(carrier: ShippingCarrier, trackingNumber: string): string | null {
  const encoded = encodeURIComponent(trackingNumber);

  switch (carrier) {
    case ShippingCarrier.SWISS_POST:
      return `https://www.post.ch/swisspost-tracking?formattedParcelCodes=${encoded}`;
    case ShippingCarrier.DHL:
      return `https://www.dhl.com/de-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${encoded}`;
    case ShippingCarrier.UPS:
      return `https://www.ups.com/track?loc=en_US&tracknum=${encoded}`;
    case ShippingCarrier.FEDEX:
      return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
    case ShippingCarrier.DPD:
      return `https://tracking.dpd.de/status/de_DE/parcel/${encoded}`;
    case ShippingCarrier.GLS:
      return `https://gls-group.com/track?match=${encoded}`;
    case ShippingCarrier.OTHER:
      return null;
  }
}
