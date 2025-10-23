import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type CreateUserRequest = {
  email?: string;
  password?: string;
  roles?: string[] | null;
  role?: string | null;
  fullName?: string;
  tipo?: string | null;
};

const passwordStrength = (password: string) => {
  const lengthOk = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const digit = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  return { lengthOk, upper, lower, digit, special, valid: lengthOk && upper && lower && digit && special };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const token = authHeader.replace('Bearer ', '');
    let requesterId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      requesterId = decoded.userId;
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const rolesData = await sql(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [requesterId]
    );

    const isAllowed = rolesData.some((r: any) =>
      ['admin', 'gestor_master', 'financeiro_master'].includes(r.role)
    );

    if (!isAllowed) {
      return res.status(403).json({ error: 'Sem permissão para criar usuários' });
    }

    const body = req.body as CreateUserRequest;

    if (!body.email || !body.password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    const strength = passwordStrength(body.password);
    if (!strength.valid) {
      return res.status(400).json({ error: 'weak_password', details: strength });
    }

    const rolesInput = body.roles ?? (body.role ? [body.role] : []);
    const uniqueRoles = Array.from(new Set(rolesInput));

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const existingUser = await sql(
      'SELECT id FROM users WHERE email = $1',
      [body.email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = await sql(
      `INSERT INTO users (email, password_hash, full_name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, full_name, created_at`,
      [body.email, hashedPassword, body.fullName || body.email]
    );

    const createdUser = newUser[0];

    if (uniqueRoles.length > 0) {
      for (const role of uniqueRoles) {
        await sql(
          'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
          [createdUser.id, role]
        );
      }
    }

    await sql(
      `INSERT INTO user_profiles (id, email, full_name, display_name, tipo, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       display_name = EXCLUDED.display_name,
       tipo = EXCLUDED.tipo,
       updated_at = EXCLUDED.updated_at`,
      [
        createdUser.id,
        body.email,
        body.fullName || body.email,
        body.fullName || body.email,
        body.tipo || null,
      ]
    );

    return res.status(200).json({ user: createdUser, strength });
  } catch (error) {
    console.error('Error in create-user function:', error);
    return res.status(500).json({
      error: 'internal_error',
      details: (error as Error)?.message ?? String(error),
    });
  }
}
