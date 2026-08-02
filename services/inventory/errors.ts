/** Wird geworfen, wenn eine Bestandsreduktion die Menge eines Listings unter 0 drücken würde. */
export class InsufficientInventoryError extends Error {
  constructor(listingId: string) {
    super(`Bestand für Listing ${listingId} würde durch diese Bestellung negativ werden.`);
    this.name = "InsufficientInventoryError";
  }
}
