import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else if (req.body && (req.body as any).token) {
      token = (req.body as any).token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const users = await sql('SELECT id, email, full_name, role, avatar_url, created_at FROM users WHERE id = $1', [decoded.userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Verify token error:', error);
    return res.status(500).json({ error: 'internal_error', details: (error as Error)?.message ?? String(error) });
  }
}
