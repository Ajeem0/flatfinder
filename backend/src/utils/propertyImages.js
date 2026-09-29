const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const variants = [
  { name: "thumbnail", width: 320, quality: 76 },
  { name: "card", width: 640, quality: 80 },
  { name: "medium", width: 1024, quality: 81 },
  { name: "large", width: 1600, quality: 82 },
];

function publicMediaUrl(relativePath) {
  const base = process.env.PUBLIC_MEDIA_URL || "";
  return `${base.replace(/\/$/, "")}/media/${relativePath}`;
}

async function optimizePropertyImage(source) {
  if (!source?.startsWith("data:image/")) {
    return { url: source, thumbnailUrl: source, cardUrl: source, mediumUrl: source, largeUrl: source };
  }

  const [, encoded] = source.split(",", 2);
  const input = Buffer.from(encoded || "", "base64");
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new Error("Each image must be a valid image smaller than 10 MB");

  const folder = crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
  const outputDirectory = path.join(STORAGE_ROOT, "properties", folder);
  await fs.mkdir(outputDirectory, { recursive: true });

  const results = await Promise.all(variants.map(async (variant) => {
    const filename = `${variant.name}.webp`;
    const outputPath = path.join(outputDirectory, filename);
    try {
      await fs.access(outputPath);
    } catch {
      await sharp(input)
        .rotate()
        .resize({ width: variant.width, fit: "inside", withoutEnlargement: true })
        .webp({ quality: variant.quality })
        .toFile(outputPath);
    }
    const metadata = await sharp(outputPath).metadata();
    return { name: variant.name, url: publicMediaUrl(`properties/${folder}/${filename}`), width: metadata.width, height: metadata.height };
  }));

  const large = results.find((variant) => variant.name === "large") || results[results.length - 1];
  const blurBuffer = await sharp(input).rotate().resize({ width: 24, height: 24, fit: "inside" }).webp({ quality: 35 }).toBuffer();
  const variantUrls = Object.fromEntries(results.map((variant) => [`${variant.name}Url`, variant.url]));
  return {
    url: large.url,
    ...variantUrls,
    width: large.width,
    height: large.height,
    blurDataUrl: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  };
}

async function optimizePropertyImages(images = []) {
  return Promise.all(images.map((image) => optimizePropertyImage(image)));
}

module.exports = { optimizePropertyImage, optimizePropertyImages };