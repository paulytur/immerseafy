import { removeBackground } from "@imgly/background-removal-node";
import { writeFileSync } from "fs";
import { pathToFileURL } from "url";

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error("Usage: node scripts/remove-bg.mjs <input> <output>");
  process.exit(1);
}

const imageUrl = pathToFileURL(input).href;
const blob = await removeBackground(imageUrl);
const buffer = Buffer.from(await blob.arrayBuffer());
writeFileSync(output, buffer);
console.log("Saved:", output);
