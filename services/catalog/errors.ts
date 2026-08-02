/** Game.slug ist bereits vergeben. */
export class DuplicateSlugError extends Error {
  constructor() {
    super("Dieser Slug ist bereits vergeben.");
    this.name = "DuplicateSlugError";
  }
}

/** Set.code ist innerhalb desselben Games bereits vergeben. */
export class DuplicateSetCodeError extends Error {
  constructor() {
    super("Dieser Set-Code ist in diesem Spiel bereits vergeben.");
    this.name = "DuplicateSetCodeError";
  }
}

/** Card mit derselben cardNumber existiert in diesem Set (+ Sprache) bereits. */
export class DuplicateCardNumberError extends Error {
  constructor() {
    super("Diese Kartennummer existiert in diesem Set bereits.");
    this.name = "DuplicateCardNumberError";
  }
}

/** Referenziertes Game existiert nicht. */
export class GameNotFoundError extends Error {
  constructor() {
    super("Spiel nicht gefunden.");
    this.name = "GameNotFoundError";
  }
}

/** Referenziertes Set existiert nicht. */
export class SetNotFoundError extends Error {
  constructor() {
    super("Set nicht gefunden.");
    this.name = "SetNotFoundError";
  }
}
