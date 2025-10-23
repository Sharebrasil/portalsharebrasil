import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

const DATABASE_URL = import.meta.env.DATABASE_URL as string;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(DATABASE_URL);

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const result = await sql(text, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
