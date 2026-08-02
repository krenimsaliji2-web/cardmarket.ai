import "dotenv/config";

import { prisma } from "../lib/prisma";
import { LorcanaImporter } from "../services/import/LorcanaImporter";

function logResult(label: string, result: { created: number; updated: number; skipped: number; errors: string[] }) {
  console.log(
    `${label}: ${result.created} angelegt, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`,
  );
  for (const error of result.errors) {
    console.error(`  ✖ ${error}`);
  }
}

async function main() {
  const importer = new LorcanaImporter(prisma);

  logResult("Games", await importer.importGames());
  logResult("Sets", await importer.importSets());
  logResult("Cards", await importer.importCards());

  const totalSets = await prisma.set.count({ where: { game: { slug: importer.gameSlug } } });
  const totalCards = await prisma.card.count({ where: { game: { slug: importer.gameSlug } } });
  console.log(`\nGesamt: ${totalSets} Lorcana-Sets, ${totalCards} Lorcana-Karten in der Datenbank.`);
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
