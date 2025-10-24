import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

const passwordStrength = (password: string) => {
  const lengthOk = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const digit = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  return { lengthOk, upper, lower, digit, special, valid: lengthOk && upper && lower && digit && special };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body as { email?: string; password?: string; fullName?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    const strength = passwordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ error: 'weak_password', details: strength });
    }

    const existing = await sql('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const inserted = await sql(
      `INSERT INTO users (email, password_hash, full_name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, full_name, created_at`,
      [email, hashedPassword, fullName || email]
    );

    const createdUser = inserted[0];

    await sql(
      `INSERT INTO user_profiles (id, email, full_name, display_name, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       display_name = EXCLUDED.display_name,
       updated_at = EXCLUDED.updated_at`,
      [createdUser.id, email, fullName || email, fullName || email]
    );

    const token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({ user: createdUser, token });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'internal_error', details: (error as Error)?.message ?? String(error) });
  }
}
