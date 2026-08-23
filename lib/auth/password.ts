import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * scrypt parameters. N=2^15 with r=8 costs roughly 100ms on commodity
 * hardware, which is the usual interactive-login target. `maxmem` has to be
 * raised past Node's 32MB default to fit N=32768.
 */
const PARAMS = { N: 32_768, r: 8, p: 1, maxmem: 128 * 32_768 * 8 * 2 };
const KEY_LENGTH = 64;

/** Produces `scrypt$N$r$p$salt$key`, all binary parts base64url encoded. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

/**
 * Compares a candidate password against a stored hash in constant time.
 * Returns false rather than throwing on a malformed hash so a corrupt row
 * cannot turn into a 500 on the login path.
 */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!storedHash) return false;

  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltPart, keyPart] = parts;
  const N = Number.parseInt(n, 10);
  const rValue = Number.parseInt(r, 10);
  const pValue = Number.parseInt(p, 10);
  if (!N || !rValue || !pValue) return false;

  try {
    const salt = Buffer.from(saltPart, "base64url");
    const expected = Buffer.from(keyPart, "base64url");
    const actual = await scrypt(
      password.normalize("NFKC"),
      salt,
      expected.length,
      { N, r: rValue, p: pValue, maxmem: 128 * N * rValue * 2 },
    );
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Burns roughly the same time as a real verification. Called when the email
 * does not exist so response timing does not reveal which accounts are real.
 */
export async function fakeVerify(): Promise<void> {
  await scrypt("dummy-password", randomBytes(16), KEY_LENGTH, PARAMS);
}
