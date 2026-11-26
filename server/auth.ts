import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type UserRole = 'customer' | 'admin';

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isPasscodeAdmin?: boolean;
}

interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  isPasscodeAdmin?: boolean;
  jti: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthSessionUser;
  authToken?: string;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_SIGNING_KEY =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const revokedTokenIds = new Set<string>();

export function hasConfiguredAdminPasscode(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
}

export function verifyConfiguredAdminPasscode(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSCODE?.trim();
  if (!expected || !candidate) return false;
  const expectedBuf = crypto.createHash('sha256').update(expected).digest();
  const candidateBuf = crypto.createHash('sha256').update(candidate).digest();
  return crypto.timingSafeEqual(expectedBuf, candidateBuf);
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

function signSegment(payloadBase64: string): string {
  return crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(payloadBase64)
    .digest('base64url');
}

export function issueSessionToken(user: AuthSessionUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isPasscodeAdmin: user.isPasscodeAdmin,
    jti: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signSegment(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = signSegment(encoded);
  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as TokenPayload;
    if (!decoded || typeof decoded.sub !== 'string' || typeof decoded.exp !== 'number') {
      return null;
    }
    if (decoded.exp < Date.now()) return null;
    if (revokedTokenIds.has(decoded.jti)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function revokeSessionToken(token: string): void {
  const payload = verifySessionToken(token);
  if (payload?.jti) {
    revokedTokenIds.add(payload.jti);
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

export function createAuthMiddlewares(
  lookupUserRoleById: (
    id: string
  ) =>
    | Promise<{ id: string; name: string; email: string; role: UserRole } | null>
    | { id: string; name: string; email: string; role: UserRole }
    | null
) {
  async function attachSession(req: AuthenticatedRequest): Promise<AuthSessionUser | null> {
    const token = extractBearerToken(req);
    if (!token) return null;
    const payload = verifySessionToken(token);
    if (!payload) return null;

    if (payload.isPasscodeAdmin && hasConfiguredAdminPasscode()) {
      const adminUser: AuthSessionUser = {
        id: 'env-admin',
        name: payload.name || 'Rooznam Owner',
        email: payload.email || 'ahmadmail59268@gmail.com',
        role: 'admin',
        isPasscodeAdmin: true,
      };
      req.authUser = adminUser;
      req.authToken = token;
      return adminUser;
    }

    try {
      const dbUser = await lookupUserRoleById(payload.sub);
      if (!dbUser) return null;

      const sessionUser: AuthSessionUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };
      req.authUser = sessionUser;
      req.authToken = token;
      return sessionUser;
    } catch {
      return null;
    }
  }

  async function authenticateOptional(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) {
    await attachSession(req);
    next();
  }

  async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const user = await attachSession(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    next();
  }

  async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const user = await attachSession(req);
    if (!user) {
      res.status(401).json({ error: 'Admin sign-in required.' });
      return;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Admin privileges are required for this action.' });
      return;
    }
    next();
  }

  return { authenticateOptional, requireAuth, requireAdmin };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1200) return false;
  if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/assets/')) {
    return !trimmed.includes('..');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function clampString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}
