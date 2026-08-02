/** Bestellung existiert nicht oder gehört nicht dem Käufer. */
export class OrderNotFoundError extends Error {
  constructor() {
    super("Bestellung nicht gefunden oder keine Berechtigung.");
    this.name = "OrderNotFoundError";
  }
}

/** Der angegebene Verkäufer kommt in dieser Bestellung nicht vor. */
export class SellerNotInOrderError extends Error {
  constructor() {
    super("Dieser Verkäufer ist nicht Teil dieser Bestellung.");
    this.name = "SellerNotInOrderError";
  }
}

/** rating liegt nicht im gültigen Bereich 1–5. */
export class InvalidRatingError extends Error {
  constructor() {
    super("Die Bewertung muss zwischen 1 und 5 Sternen liegen.");
    this.name = "InvalidRatingError";
  }
}

/** comment überschreitet die maximale Länge von 1000 Zeichen. */
export class CommentTooLongError extends Error {
  constructor() {
    super("Der Kommentar darf maximal 1000 Zeichen lang sein.");
    this.name = "CommentTooLongError";
  }
}
