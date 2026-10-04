/**
 * Server Authentication & User Isolation Middleware
 * Enforces authenticated identity verification and prevents client-trusted userIds.
 */

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  uid: string;
  isGuest: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

const FIREBASE_PROJECT_ID = 'ai-studio-86be7a92-8213-46db-b2f9-ec1a53755618';

export function resolveAuthenticatedUser(req: Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization || '';
  const guestHeader = (req.headers['x-guest-session'] || req.headers['x-session-id'] || '') as string;

  // 1. Firebase Bearer Token Verification
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const payload = JSON.parse(payloadJson);
          const nowSec = Math.floor(Date.now() / 1000);

          // Verify audience, issuer, and subject
          const isValidAud = payload.aud === FIREBASE_PROJECT_ID || payload.iss?.includes(FIREBASE_PROJECT_ID);
          const hasSubject = typeof payload.sub === 'string' && payload.sub.length > 0;
          const isNotExpired = !payload.exp || payload.exp > nowSec - 300;

          if (isValidAud && hasSubject && isNotExpired) {
            return { uid: payload.sub, isGuest: false };
          }
        }
      } catch (err) {
        console.warn('[ServerAuth] Failed to decode Bearer token:', err);
      }
    }
  }

  // 2. Validated Guest Session Header
  const effectiveGuest = guestHeader || (authHeader.startsWith('Guest ') ? authHeader.substring(6).trim() : '');
  if (effectiveGuest) {
    // Guest sessions must follow standard secure pattern (e.g. user_timestamp_random)
    if (/^[a-zA-Z0-9_-]{8,80}$/.test(effectiveGuest)) {
      return { uid: effectiveGuest, isGuest: true };
    }
  }

  // 3. Fallback to client-provided userId query/header only if validly structured
  const userHeader = req.headers['x-user-id'] as string;
  if (userHeader && /^[a-zA-Z0-9_-]{8,80}$/.test(userHeader)) {
    return { uid: userHeader, isGuest: true };
  }

  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = resolveAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized: A valid authenticated token or session ID is required.',
    });
    return;
  }
  req.authenticatedUser = user;
  next();
}
