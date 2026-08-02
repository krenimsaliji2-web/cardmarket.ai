import { prisma } from "../lib/prisma";

const games = [
  { name: "Pokémon", slug: "pokemon" },
  { name: "Yu-Gi-Oh!", slug: "yu-gi-oh" },
  { name: "Magic: The Gathering", slug: "magic-the-gathering" },
  { name: "One Piece Card Game", slug: "one-piece-card-game" },
  { name: "Disney Lorcana", slug: "disney-lorcana" },
];

async function main() {
  for (const game of games) {
    const result = await prisma.game.upsert({
      where: { slug: game.slug },
      update: { name: game.name, isActive: true },
      create: { ...game, isActive: true },
    });
    console.log(`✔ Game geseedet: ${result.name} (${result.slug})`);
  }
}

main()
  .then(async () => {
    console.log(`\nFertig: ${games.length} Games geseedet.`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
