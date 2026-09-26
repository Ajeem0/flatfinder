const prisma = require("../src/config/db");
const { optimizePropertyImages } = require("../src/utils/propertyImages");

async function main() {
  const images = await prisma.propertyImage.findMany({
    where: { url: { startsWith: "data:image/" } },
    select: { id: true, url: true },
  });

  console.log(`Found ${images.length} base64 image(s) to optimize.`);
  for (const image of images) {
    try {
      const [optimized] = await optimizePropertyImages([image.url]);
      await prisma.propertyImage.update({
        where: { id: image.id },
        data: optimized,
      });
    } catch (error) {
      console.error(`Could not optimize image ${image.id}:`, error.message);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
