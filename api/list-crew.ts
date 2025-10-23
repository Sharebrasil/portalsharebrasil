import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type CrewMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  roles: string[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method !== 'GET') {
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

    const allowed = rolesData.some((r: any) =>
      ['admin', 'gestor_master', 'financeiro_master', 'operacoes', 'financeiro', 'piloto_chefe'].includes(r.role)
    );

    if (!allowed) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const targetRoles = ['tripulante', 'piloto_chefe'];

    const roleAssignments = await sql(
      'SELECT user_id, role FROM user_roles WHERE role = ANY($1)',
      [targetRoles]
    );

    const userIds = Array.from(
      new Set(roleAssignments.map((r: any) => r.user_id).filter(Boolean))
    );

    if (userIds.length === 0) {
      return res.status(200).json({ crew: [] });
    }

    const profiles = await sql(
      'SELECT id, full_name, email, phone, avatar_url FROM user_profiles WHERE id = ANY($1)',
      [userIds]
    );

    const rolesByUser = new Map<string, string[]>();
    roleAssignments.forEach((r: any) => {
      if (!r?.user_id || !r?.role) return;
      const list = rolesByUser.get(r.user_id) ?? [];
      if (!list.includes(r.role)) list.push(String(r.role));
      rolesByUser.set(r.user_id, list);
    });

    const crew: CrewMember[] = profiles.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone ?? null,
      avatar_url: p.avatar_url ?? null,
      roles: rolesByUser.get(p.id) ?? [],
    }));

    crew.sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '', 'pt-BR')
    );

    return res.status(200).json({ crew });
  } catch (error) {
    console.error('Error in list-crew function:', error);
    return res.status(500).json({
      error: 'internal_error',
      details: (error as Error)?.message ?? String(error),
    });
  }
}
