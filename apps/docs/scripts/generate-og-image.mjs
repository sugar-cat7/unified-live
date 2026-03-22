import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svg = readFileSync(join(publicDir, "og-image.svg"));
await sharp(svg).resize(1200, 630).png().toFile(join(publicDir, "og-image.png"));

console.log("Generated og-image.png (1200x630)");
