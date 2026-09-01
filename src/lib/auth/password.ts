import bcrypt from "bcryptjs";

/** Cost 10 — the ceiling Hostinger's shared CPU handles without login latency. */
const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) throw new Error("Password must be at least 8 characters");
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
