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
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { user: null, token: null, error: data.error || 'Failed to create account' };
    }

    return { user: data.user || null, token: data.token || null, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, token: null, error: 'Failed to create account' };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { user: null, token: null, error: data.error || 'Invalid credentials' };
    }

    return { user: data.user || null, token: data.token || null, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, token: null, error: 'Failed to sign in' };
  }
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/user?id=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
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
