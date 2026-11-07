/**
 * Normalization utilities for business identity, phone numbers,
 * domain names, duplicate keys, and formula injection protection.
 */

import { findCountry } from './countries';
import { parsePakistanPhone, formatPakistanPhoneForExport, PakistanPhoneAnalysis } from './pakistanPhone';

export { parsePakistanPhone, formatPakistanPhoneForExport };
export type { PakistanPhoneAnalysis };

/**
 * Strict Phone Number Validator:
 * Rejects placeholder patterns, repeated digits (e.g. 1111111111, 090909090909),
 * sequential dummies, and malformed phone values.
 */
export function isValidPhoneNumber(rawPhone: string, countryInput: string = ''): boolean {
  if (!rawPhone) return false;

  const isPakistan = countryInput.toLowerCase().includes('pakistan') || countryInput.toLowerCase() === 'pk';
  if (isPakistan) {
    const pak = parsePakistanPhone(rawPhone);
    return pak.isValid;
  }

  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;

  // Reject all identical digits (e.g. 1111111111, 9999999999, 0000000000)
  if (/^(\d)\1+$/.test(digits)) return false;

  // Reject phone numbers where 5 or more identical digits repeat in sequence (e.g. 777777, 000000, 999999)
  if (/(\d)\1{4,}/.test(digits)) return false;

  // Reject alternating 2-digit patterns (e.g. 090909090909, 1212121212)
  if (/^(\d{2})\1{2,}$/.test(digits)) return false;

  // Reject dummy sequences
  if (digits === '123456789' || digits === '1234567890' || digits === '0123456789' || digits === '9876543210') return false;

  // Reject invalid prefixes
  if (digits.startsWith('0000') || digits.startsWith('1111')) return false;

  return true;
}

/**
 * Formats a phone number for clean human and spreadsheet display,
 * preserving leading zeros strictly as text for Pakistan.
 */
export function formatDisplayPhone(rawPhone: string, countryInput: string = ''): string {
  if (!rawPhone) return '';
  const isPakistan = countryInput.toLowerCase().includes('pakistan') || countryInput.toLowerCase() === 'pk';
  if (isPakistan) {
    return formatPakistanPhoneForExport(rawPhone);
  }
  return rawPhone.trim();
}

/**
 * Normalizes phone numbers according to strict rules:
 * - For UK: 44XXXXXXXXXX (NO +, NO spaces, NO brackets, NO hyphens)
 * - For Pakistan: 03XX-XXXXXXX or 021-XXXXXXXX (preserves domestic 0 strictly)
 * - For other countries: International format without '+'
 * - Always returned as a clean string suitable for text export.
 */
export function normalizePhoneNumber(rawPhone: string, countryInput: string): string {
  if (!rawPhone || !isValidPhoneNumber(rawPhone, countryInput)) return '';

  const country = findCountry(countryInput);
  const isUK = country?.code === 'GB' || countryInput.toLowerCase().includes('uk') || countryInput.toLowerCase().includes('united kingdom');
  const isPakistan = country?.code === 'PK' || countryInput.toLowerCase().includes('pakistan');

  if (isPakistan) {
    const pak = parsePakistanPhone(rawPhone);
    if (pak.isValid) {
      return pak.domesticRaw; // Always returns domestic number with leading 0 (e.g. "03001234567" or "02134567890")
    }
  }

  // Remove whitespace, dashes, parentheses, dots, slashes
  let cleaned = rawPhone.replace(/[\s\-\(\)\.\/\\]/g, '').trim();

  // Remove leading '+' if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  let normalized = cleaned;

  if (isUK) {
    // If it starts with UK domestic 0 (e.g. 07700900123 or 02079460123)
    if (cleaned.startsWith('0')) {
      normalized = '44' + cleaned.substring(1);
    } else if (cleaned.startsWith('44')) {
      // Already starts with 44
      // Sometimes people write 4407... remove domestic zero after 44
      if (cleaned.startsWith('440')) {
        normalized = '44' + cleaned.substring(3);
      }
    } else if (cleaned.length >= 10 && !cleaned.startsWith('44')) {
      normalized = '44' + cleaned;
    }
    // Strictly numeric only for UK
    normalized = normalized.replace(/\D/g, '');
  } else if (country?.dialCode) {
    // Other countries
    const dial = country.dialCode;
    if (cleaned.startsWith('00' + dial)) {
      normalized = dial + cleaned.substring(2 + dial.length);
    } else if (cleaned.startsWith('0')) {
      normalized = dial + cleaned.substring(1);
    } else if (!cleaned.startsWith(dial) && cleaned.length >= 7) {
      normalized = dial + cleaned;
    }
    normalized = normalized.replace(/\D/g, '');
  } else {
    normalized = cleaned.replace(/\D/g, '');
  }

  // Final check on normalized digits
  if (!isValidPhoneNumber(normalized, countryInput)) {
    return '';
  }

  return normalized;
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
