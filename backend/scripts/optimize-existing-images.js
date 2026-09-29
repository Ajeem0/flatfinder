require("dotenv").config();
const prisma = require("../src/config/db");
const { optimizePropertyImage } = require("../src/utils/propertyImages");

async function main() {
  const images = await prisma.propertyImage.findMany({
    where: {
      OR: [
        { url: { startsWith: "data:image/" } },
        { thumbnailUrl: null },
        { cardUrl: null },
        { mediumUrl: null },
        { largeUrl: null },
      ],
    },
    select: { id: true, url: true },
  });

  for (const image of images) {
    if (!image.url?.startsWith("data:image/")) continue;
    const optimized = await optimizePropertyImage(image.url);
    await prisma.propertyImage.update({ where: { id: image.id }, data: optimized });
    console.log(`Optimized ${image.id}`);
  }
  console.log(`Processed ${images.length} image record(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());const prisma = require("../src/config/db");
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
