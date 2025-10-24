import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = req.query.id as string | undefined;
    if (!id) {
      return res.status(400).json({ error: 'id_required' });
    }

    const users = await sql('SELECT id, email, full_name, role, avatar_url, created_at FROM users WHERE id = $1', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'internal_error', details: (error as Error)?.message ?? String(error) });
  }
}
