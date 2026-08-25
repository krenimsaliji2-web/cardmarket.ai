import Link from "next/link";

/**
 * Globale Fußzeile (analog zu SiteHeader, Feature 84). Rein statisch, keine
 * Session/DB-Abfrage nötig. Verlinkt die rechtlichen Pflichtseiten
 * (Impressum/Datenschutz/AGB) – bisher gab es dafür weder Seiten noch einen
 * Ort, sie zu verlinken.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          © {year} Project Atlas. Alle Rechte vorbehalten.
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:text-foreground">
            AGB
          </Link>
        </nav>
      </div>
    </footer>
  );
}
