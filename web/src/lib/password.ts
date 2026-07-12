import bcrypt from 'bcryptjs';

// bcryptjs is pure-JS and installs everywhere. For a hardened production
// deployment, argon2id is the stronger choice (swap here — the API is the same).
export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
