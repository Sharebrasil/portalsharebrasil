import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: 'userId_required' });
    }

    const rows = await sql('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
    const roles = rows.map((r: any) => r.role || '').filter(Boolean);
    return res.status(200).json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({ error: 'internal_error', details: (error as Error)?.message ?? String(error) });
  }
}
