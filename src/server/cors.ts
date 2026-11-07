/**
 * Production-Safe CORS Configuration Middleware
 * Strictly limits allowed origins in production to prevent unauthorized cross-origin access.
 *
 * Configurable via environment variable:
 * - ALLOWED_ORIGINS (comma-separated, e.g. "https://myuser.github.io,https://leadpulse.mydomain.com")
 * - CORS_ORIGIN (single origin string)
 *
 * In development, allows localhost:3000 and localhost:5173.
 * Strictly avoids unrestricted Access-Control-Allow-Origin: * for authenticated endpoints.
 */

import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';

export function getCorsOptions(): CorsOptions {
  const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, same-origin)
      if (!origin) {
        return callback(null, true);
      }

      // If explicit production origins configured, check match
      if (envOrigins.length > 0) {
        if (envOrigins.includes(origin)) {
          return callback(null, true);
        }
        // In non-production, still allow local dev origins
        if (process.env.NODE_ENV !== 'production' && defaultDevOrigins.includes(origin)) {
          return callback(null, true);
        }
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        return callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
      }

      // If in development and no production origins specified, allow dev origins & same host
      if (process.env.NODE_ENV !== 'production') {
        if (defaultDevOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      // Default safe fallback in production if no ALLOWED_ORIGINS set:
      // In production mode, require explicit origin or reject unknown cross-origins
      if (process.env.NODE_ENV === 'production') {
        console.warn(`[CORS] Warning: ALLOWED_ORIGINS not configured in production. Blocking cross-origin request from: ${origin}`);
        return callback(new Error(`CORS blocked: Origin ${origin} not in ALLOWED_ORIGINS.`));
      }

      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Guest-Session',
      'X-Session-ID',
      'X-User-ID',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400, // 24 hours preflight cache
  };
}

export const corsMiddleware = cors(getCorsOptions());
