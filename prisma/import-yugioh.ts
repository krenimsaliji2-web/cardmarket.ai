import "dotenv/config";

import { prisma } from "../lib/prisma";
import { YugiohImporter } from "../services/import/YugiohImporter";

function logResult(label: string, result: { created: number; updated: number; skipped: number; errors: string[] }) {
  console.log(
    `${label}: ${result.created} angelegt, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`,
  );
  for (const error of result.errors) {
    console.error(`  ✖ ${error}`);
  }
}

async function main() {
  const importer = new YugiohImporter(prisma);

  logResult("Games", await importer.importGames());
  logResult("Sets", await importer.importSets());
  logResult("Cards", await importer.importCards());

  const totalSets = await prisma.set.count({ where: { game: { slug: importer.gameSlug } } });
  const totalCards = await prisma.card.count({ where: { game: { slug: importer.gameSlug } } });
  console.log(`\nGesamt: ${totalSets} Yu-Gi-Oh!-Sets, ${totalCards} Yu-Gi-Oh!-Karten in der Datenbank.`);
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
