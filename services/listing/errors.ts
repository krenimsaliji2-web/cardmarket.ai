/** Geteilt von allen Listing-Services, die eine Ownership-Prüfung durchführen. */
export class ListingNotFoundError extends Error {
  constructor() {
    super("Listing nicht gefunden oder keine Berechtigung.");
    this.name = "ListingNotFoundError";
  }
}
