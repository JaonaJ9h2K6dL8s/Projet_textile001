import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

/**
 * Hachage et vérification des mots de passe avec bcryptjs.
 * Aucun mot de passe en clair n'est jamais stocké ni journalisé.
 */

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

/** Mot de passe temporaire lisible généré pour les réinitialisations. */
export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(12);
  let password = '';
  for (const byte of bytes) {
    password += alphabet[byte % alphabet.length];
  }
  return password;
}
