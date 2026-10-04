/**
 * Normalization utilities for business identity, phone numbers,
 * domain names, duplicate keys, and formula injection protection.
 */

import { findCountry } from './countries';

/**
 * Normalizes phone numbers according to strict rules:
 * - For UK: 44XXXXXXXXXX (NO +, NO spaces, NO brackets, NO hyphens)
 * - For other countries: International format without '+'
 * - Always returned as a clean string suitable for text export.
 */
export function normalizePhoneNumber(rawPhone: string, countryInput: string): string {
  if (!rawPhone) return '';

  // Remove whitespace, dashes, parentheses, dots, slashes
  let cleaned = rawPhone.replace(/[\s\-\(\)\.\/\\]/g, '').trim();

  // Remove leading '+' if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  const country = findCountry(countryInput);
  const isUK = country?.code === 'GB' || countryInput.toLowerCase().includes('uk') || countryInput.toLowerCase().includes('united kingdom');

  if (isUK) {
    // If it starts with UK domestic 0 (e.g. 07700900123 or 02079460123)
    if (cleaned.startsWith('0')) {
      cleaned = '44' + cleaned.substring(1);
    } else if (cleaned.startsWith('44')) {
      // Already starts with 44
      // Sometimes people write 4407... remove domestic zero after 44
      if (cleaned.startsWith('440')) {
        cleaned = '44' + cleaned.substring(3);
      }
    } else if (cleaned.length >= 10 && !cleaned.startsWith('44')) {
      cleaned = '44' + cleaned;
    }
    // Strictly numeric only for UK
    return cleaned.replace(/\D/g, '');
  }

  // Other countries
  if (country?.dialCode) {
    const dial = country.dialCode;
    if (cleaned.startsWith('00' + dial)) {
      cleaned = dial + cleaned.substring(2 + dial.length);
    } else if (cleaned.startsWith('0')) {
      cleaned = dial + cleaned.substring(1);
    } else if (!cleaned.startsWith(dial) && cleaned.length >= 7) {
      cleaned = dial + cleaned;
    }
  }

  // Strip all non-digits
  return cleaned.replace(/\D/g, '');
}

/**
 * Extracts canonical domain from website URL
 * e.g. "https://www.example.co.uk/about-us" -> "example.co.uk"
 */
export function extractCanonicalDomain(rawUrl: string): string {
  if (!rawUrl) return '';

  try {
    let clean = rawUrl.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    let host = parsed.hostname;
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }
    return host;
  } catch {
    // Fallback if URL parsing fails
    let domain = rawUrl.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0].trim();
    return domain;
  }
}

/**
 * Normalizes company name for duplicate detection
 * Strips common legal suffixes: Ltd, Limited, LLC, Inc, Corp, Co, LLP, GmbH, etc.
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Remove common punctuation
  normalized = normalized.replace(/[,\.\-\/\\&]/g, ' ');

  // Strip legal forms at the end of string
  const legalSuffixes = [
    'limited', 'ltd', 'plc', 'llc', 'inc', 'incorporated', 'corp', 'corporation',
    'co', 'company', 'llp', 'lp', 'gmbh', 'sa', 'srl', 'pty', 'bv', 'ag', 'pvt'
  ];

  const words = normalized.split(/\s+/).filter(Boolean);
  while (words.length > 1 && legalSuffixes.includes(words[words.length - 1])) {
    words.pop();
  }

  return words.join(' ');
}

/**
 * Generates a deterministic duplicate key for a business candidate
 */
export function generateDuplicateKey(
  companyName: string,
  country: string,
  website?: string,
  phone?: string,
  city?: string
): string {
  const normName = normalizeCompanyName(companyName);
  const normCountry = (country || '').toLowerCase().trim();
  const domain = website ? extractCanonicalDomain(website) : '';
  const normPhone = phone ? normalizePhoneNumber(phone, country) : '';
  const normCity = (city || '').toLowerCase().trim();

  // If domain is known and unique, it's the strongest identifier
  if (domain && domain.length > 3 && !isGenericDomain(domain)) {
    return `dom:${normCountry}:${domain}`;
  }

  // If phone is known
  if (normPhone && normPhone.length >= 8) {
    return `tel:${normCountry}:${normPhone}`;
  }

  // Fallback to normalized name + city + country
  return `name:${normCountry}:${normCity}:${normName}`;
}

/**
 * Identifies if a domain is a shared social/directory platform (not a unique company domain)
 */
export function isGenericDomain(domain: string): boolean {
  const genericDomains = [
    'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com',
    'yelp.com', 'yellowpages.com', 'yell.com', 'checkatrade.com', 'mybuilder.com',
    'trustpilot.com', 'google.com', 'maps.google.com', 'bing.com', 'apple.com',
    'youtube.com', 'tiktok.com', 'pinterest.com', 'houzz.com', 'bark.com'
  ];
  return genericDomains.some(g => domain === g || domain.endsWith('.' + g));
}

/**
 * Prevents Excel Formula Injection (CSV / XLSX security)
 * If cell starts with '=', '+', '-', '@', prepend a single quote `'`
 */
export function escapeFormula(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=\+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
