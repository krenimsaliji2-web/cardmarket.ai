/**
 * Zentrale Job-Typ-Definitionen der Queue-Infrastruktur (Feature 55 –
 * Background Jobs & Queue Foundation). Reine Definitionen – wird von
 * KEINEM bestehenden Feature ausgelöst, das ist bewusst spätere Arbeit
 * ("Nur definieren. Noch keine bestehende Funktion darauf umstellen."
 * laut Ticket).
 */
export const JobType = {
  EMAIL: "EMAIL",
  NOTIFICATION: "NOTIFICATION",
  PRICE_ALERT: "PRICE_ALERT",
  IMAGE_PROCESSING: "IMAGE_PROCESSING",
  ANALYTICS: "ANALYTICS",
  EXPORT: "EXPORT",
  SYNC: "SYNC",
  /** Feature 60 – Catalog Import Queue Integration. */
  CATALOG_IMPORT: "CATALOG_IMPORT",
  /** Feature 61 – Review Queue Integration. */
  REVIEW: "REVIEW",
  /** Feature 62 – Order Queue Integration. */
  ORDER: "ORDER",
  /** Feature 63 – Seller Queue Integration. */
  SELLER: "SELLER",
  /** Feature 64 – Marketplace Queue Integration. */
  MARKETPLACE: "MARKETPLACE",
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];

/**
 * BullMQ-Priorität: je KLEINER die Zahl, desto höher die Priorität
 * (offizielle BullMQ-Semantik). CRITICAL wird daher am kleinsten gewählt.
 */
export const JobPriority = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
} as const;

export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority];

/**
 * Payload bewusst generisch (`Record<string, unknown>`) statt pro Jobtyp
 * domänenspezifisch typisiert – konkrete Payload-Formen würden Importe
 * aus den jeweiligen Fach-Services erzwingen (Email/Notifications/Price
 * Alerts/Import/Analytics) und damit genau die Kopplung einführen, die
 * dieses Foundation-Feature laut Ticket noch nicht herstellen soll.
 */
export type JobPayload = Record<string, unknown>;
