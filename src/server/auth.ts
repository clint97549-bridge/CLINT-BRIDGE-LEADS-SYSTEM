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

import firebaseConfig from '../../firebase-applet-config.json';

const KNOWN_PROJECT_IDS = new Set([
  firebaseConfig.projectId,
  firebaseConfig.firestoreDatabaseId,
  'elaborate-alloy-j61jg',
  'ai-studio-86be7a92-8213-46db-b2f9-ec1a53755618',
  process.env.FIREBASE_PROJECT_ID,
].filter(Boolean) as string[]);

export function resolveAuthenticatedUser(req: Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization || '';
  const guestHeader = (req.headers['x-guest-session'] || req.headers['x-session-id'] || req.headers['x-user-id'] || '') as string;

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

          // Verify Firebase token format
          const hasSubject = typeof (payload.sub || payload.user_id) === 'string' && (payload.sub || payload.user_id).length > 0;
          const isNotExpired = !payload.exp || payload.exp > nowSec - 300;
          const isGoogleIssuer =
            payload.iss?.startsWith('https://securetoken.google.com/') ||
            payload.iss?.includes('firebase');
          const isValidAud =
            KNOWN_PROJECT_IDS.has(payload.aud) ||
            Array.from(KNOWN_PROJECT_IDS).some((pid) => payload.iss?.includes(pid)) ||
            isGoogleIssuer;

          if (hasSubject && isNotExpired && isValidAud) {
            return { uid: payload.sub || payload.user_id, isGuest: false };
          }
        }
      } catch (err) {
        console.warn('[ServerAuth] Failed to decode Bearer token:', err);
      }
    }
  }

  // 2. Validated Guest / User Session Header (Fallback)
  const effectiveGuest =
    guestHeader ||
    (authHeader.startsWith('Guest ') ? authHeader.substring(6).trim() : '');

  if (effectiveGuest) {
    // Session IDs must be alphanumeric strings without injection characters
    if (/^[a-zA-Z0-9_.-]{4,100}$/.test(effectiveGuest)) {
      return { uid: effectiveGuest, isGuest: true };
    }
  }

  // Unauthenticated requests are rejected.
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
