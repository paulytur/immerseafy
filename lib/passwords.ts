import { randomBytes } from "crypto";

const CHARSET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTemporaryPassword(length = 16): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join("");
}
