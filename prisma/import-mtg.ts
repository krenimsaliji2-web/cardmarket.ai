import "dotenv/config";

import { prisma } from "../lib/prisma";
import { MtgImporter } from "../services/import/MtgImporter";

function logResult(label: string, result: { created: number; updated: number; skipped: number; errors: string[] }) {
  console.log(
    `${label}: ${result.created} angelegt, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`,
  );
  for (const error of result.errors.slice(0, 50)) {
    console.error(`  ✖ ${error}`);
  }
  if (result.errors.length > 50) {
    console.error(`  … und ${result.errors.length - 50} weitere Fehler.`);
  }
}

async function main() {
  const importer = new MtgImporter(prisma);

  logResult("Games", await importer.importGames());
  logResult("Sets", await importer.importSets());
  logResult("Cards", await importer.importCards());

  const totalSets = await prisma.set.count({ where: { game: { slug: importer.gameSlug } } });
  const totalCards = await prisma.card.count({ where: { game: { slug: importer.gameSlug } } });
  console.log(`\nGesamt: ${totalSets} Magic-Sets, ${totalCards} Magic-Karten in der Datenbank.`);
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
