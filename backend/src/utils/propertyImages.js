const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const variants = [
  { name: "thumbnail", width: 400, quality: 76 },
  { name: "medium", width: 800, quality: 80 },
  { name: "large", width: 1600, quality: 82 },
];

function publicMediaUrl(relativePath) {
  const base = process.env.PUBLIC_MEDIA_URL || "";
  return `${base.replace(/\/$/, "")}/media/${relativePath}`;
}

async function optimizePropertyImage(source, index) {
  if (!source?.startsWith("data:image/")) {
    return { url: source, thumbnailUrl: source, mediumUrl: source, largeUrl: source };
  }

  const [, encoded] = source.split(",", 2);
  const input = Buffer.from(encoded || "", "base64");
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new Error("Each image must be a valid image smaller than 10 MB");

  const folder = crypto.randomUUID();
  const outputDirectory = path.join(STORAGE_ROOT, "properties", folder);
  await fs.mkdir(outputDirectory, { recursive: true });

  const urls = {};
  for (const variant of variants) {
    const filename = `${index}-${variant.name}.webp`;
    await sharp(input)
      .rotate()
      .resize({ width: variant.width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: variant.quality })
      .toFile(path.join(outputDirectory, filename));
    urls[`${variant.name}Url`] = publicMediaUrl(`properties/${folder}/${filename}`);
  }

  return { url: urls.largeUrl, ...urls };
}

async function optimizePropertyImages(images = []) {
  return Promise.all(images.map((image, index) => optimizePropertyImage(image, index)));
}

module.exports = { optimizePropertyImages };