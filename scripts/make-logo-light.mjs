import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = join(__dirname, "../public/images/logo.png");
const output = join(__dirname, "../public/images/logo-light.png");

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const alpha = data[i + 3];
  if (alpha > 16) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  } else {
    data[i + 3] = 0;
  }
}

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .png()
  .toFile(output);

console.log("Saved light logo to", output);
