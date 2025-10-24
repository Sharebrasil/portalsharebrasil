// Client-side auth now uses server endpoints. Do not import server-only modules here.

const API_BASE = '/api/auth';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User | null;
  token: string | null;
  error: string | null;
}

export async function signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  try {
    const existingUsers = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUsers.length > 0) {
      return { user: null, token: null, error: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query<User>(
      `INSERT INTO users (email, password_hash, full_name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, full_name, created_at`,
      [email, hashedPassword, fullName || '']
    );

    const user = result[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return { user, token, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, token: null, error: 'Failed to create account' };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const result = await query<User & { password_hash: string }>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.length === 0) {
      return { user: null, token: null, error: 'Invalid credentials' };
    }

    const user = result[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return { user: null, token: null, error: 'Invalid credentials' };
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, token: null, error: 'Failed to sign in' };
  }
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const result = await query<User>(
      'SELECT id, email, full_name, role, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    return result[0] || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await query<User>(
      'SELECT id, email, full_name, role, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    return result[0] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeStoredToken(): void {
  localStorage.removeItem('auth_token');
}
