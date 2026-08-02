import "dotenv/config";

import { prisma } from "../lib/prisma";
import { PokemonImporter } from "../services/import/PokemonImporter";

function logResult(label: string, result: { created: number; updated: number; skipped: number; errors: string[] }) {
  console.log(
    `${label}: ${result.created} angelegt, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`,
  );
  for (const error of result.errors) {
    console.error(`  ✖ ${error}`);
  }
}

async function main() {
  const importer = new PokemonImporter(prisma);

  logResult("Games", await importer.importGames());
  logResult("Sets", await importer.importSets());

  // Feature 81 – vollständiger Katalog statt Pilot-Set: alle lokal
  // vorhandenen (soeben importierten) Sets an importCards() übergeben,
  // statt den PokemonImporter-Default (nur "base1") zu verwenden.
  const allSetCodes = (
    await prisma.set.findMany({
      where: { game: { slug: importer.gameSlug } },
      select: { code: true },
    })
  ).map((set) => set.code);
  logResult("Cards (alle Sets)", await importer.importCards(allSetCodes));

  const totalSets = await prisma.set.count({
    where: { game: { slug: importer.gameSlug } },
  });
  const totalCards = await prisma.card.count({
    where: { game: { slug: importer.gameSlug } },
  });
  console.log(`\nGesamt: ${totalSets} Pokémon-Sets, ${totalCards} Pokémon-Karten in der Datenbank.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
