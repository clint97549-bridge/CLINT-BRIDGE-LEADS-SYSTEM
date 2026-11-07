/**
 * Dedicated Pakistan Phone Normalization, Validation, and Classification Module.
 * 
 * Rules & Standards:
 * - Pakistani Mobile: 11 digits starting with 03 (0300 through 0349, 0355, etc.).
 *   Format: 03XX-XXXXXXX (e.g. 0300-1234567)
 * - Major City Landlines (Area Code + 7-8 digits):
 *   - 021: Karachi (021-XXXXXXXX, 8 digits)
 *   - 042: Lahore (042-XXXXXXXX, 8 digits)
 *   - 051: Islamabad / Rawalpindi (051-XXXXXXX, 7 digits)
 *   - 041: Faisalabad (041-XXXXXXX, 7 digits)
 *   - 061: Multan (061-XXXXXXX, 7 digits)
 *   - 091: Peshawar (091-XXXXXXX, 7 digits)
 *   - 081: Quetta (081-XXXXXXX, 7 digits)
 *   - 055: Gujranwala (055-XXXXXXX, 7 digits)
 *   - 052: Sialkot (052-XXXXXXX, 7 digits)
 *   - 022: Hyderabad (022-XXXXXXX, 7 digits)
 *   - 071: Sukkur (071-XXXXXXX, 7 digits)
 * - UAN (Universal Access Numbers): e.g. 111-XXX-XXX (often dialed as 021-111-XXX-XXX)
 * - Toll Free: 0800-XXXXX
 * 
 * Strict Zero Preservation:
 * Ensures phone strings maintain their leading '0' (or '+92') and are NEVER stripped by spreadsheets.
 */

export type PakistanPhoneType = 'mobile' | 'landline' | 'uan' | 'toll_free' | 'unknown';

export interface PakistanPhoneAnalysis {
  isValid: boolean;
  type: PakistanPhoneType;
  raw: string;
  domesticDisplay: string;    // e.g. "0300-1234567" or "021-34567890"
  domesticRaw: string;        // e.g. "03001234567" (always begins with 0)
  e164: string;               // e.g. "+923001234567"
  cityOrOperator?: string;
  isLikelyWhatsAppCapable: boolean;
  notes?: string;
}

// Mobile prefix mapping to networks
const PAK_MOBILE_OPERATORS: Record<string, string> = {
  '0300': 'Jazz', '0301': 'Jazz', '0302': 'Jazz', '0303': 'Jazz', '0304': 'Jazz',
  '0305': 'Jazz', '0306': 'Jazz', '0307': 'Jazz', '0308': 'Jazz', '0309': 'Jazz',
  '0310': 'Zong', '0311': 'Zong', '0312': 'Zong', '0313': 'Zong', '0314': 'Zong',
  '0315': 'Zong', '0316': 'Zong', '0317': 'Zong', '0318': 'Zong',
  '0320': 'Warid/Jazz', '0321': 'Warid/Jazz', '0322': 'Warid/Jazz', '0323': 'Warid/Jazz', '0324': 'Warid/Jazz',
  '0330': 'Ufone', '0331': 'Ufone', '0332': 'Ufone', '0333': 'Ufone', '0334': 'Ufone',
  '0335': 'Ufone', '0336': 'Ufone', '0337': 'Ufone',
  '0340': 'Telenor', '0341': 'Telenor', '0342': 'Telenor', '0343': 'Telenor', '0344': 'Telenor',
  '0345': 'Telenor', '0346': 'Telenor', '0347': 'Telenor', '0348': 'Telenor', '0349': 'Telenor',
  '0355': 'SCOM (AJK/GB)',
};

// Major Pakistani landline area codes
const PAK_LANDLINE_AREA_CODES: Record<string, { city: string; digitsAfterArea: number }> = {
  '021': { city: 'Karachi', digitsAfterArea: 8 },
  '042': { city: 'Lahore', digitsAfterArea: 8 },
  '051': { city: 'Islamabad / Rawalpindi', digitsAfterArea: 7 },
  '041': { city: 'Faisalabad', digitsAfterArea: 7 },
  '061': { city: 'Multan', digitsAfterArea: 7 },
  '091': { city: 'Peshawar', digitsAfterArea: 7 },
  '081': { city: 'Quetta', digitsAfterArea: 7 },
  '055': { city: 'Gujranwala', digitsAfterArea: 7 },
  '052': { city: 'Sialkot', digitsAfterArea: 7 },
  '022': { city: 'Hyderabad', digitsAfterArea: 7 },
  '071': { city: 'Sukkur', digitsAfterArea: 7 },
  '053': { city: 'Gujrat', digitsAfterArea: 7 },
  '0544': { city: 'Jhelum', digitsAfterArea: 6 },
  '0546': { city: 'Mandi Bahauddin', digitsAfterArea: 6 },
  '056': { city: 'Sheikhupura', digitsAfterArea: 7 },
  '062': { city: 'Bahawalpur', digitsAfterArea: 7 },
  '064': { city: 'Dera Ghazi Khan', digitsAfterArea: 7 },
  '0722': { city: 'Jacobabad', digitsAfterArea: 6 },
  '0723': { city: 'Ghotki', digitsAfterArea: 6 },
  '074': { city: 'Larkana', digitsAfterArea: 7 },
  '0992': { city: 'Abbottabad', digitsAfterArea: 6 },
  '0997': { city: 'Mansehra', digitsAfterArea: 6 },
  '0937': { city: 'Mardan', digitsAfterArea: 6 },
  '0946': { city: 'Swat', digitsAfterArea: 6 },
  '0852': { city: 'Gwadar', digitsAfterArea: 6 },
  '086': { city: 'Turbat', digitsAfterArea: 7 },
  '05822': { city: 'Muzaffarabad (AJK)', digitsAfterArea: 5 },
  '05827': { city: 'Mirpur (AJK)', digitsAfterArea: 5 },
  '05811': { city: 'Gilgit', digitsAfterArea: 5 },
  '05815': { city: 'Skardu', digitsAfterArea: 5 },
};

/**
 * Normalizes input string to clean digits, handling international prefixes (0092, +92, 92).
 */
export function extractPakistaniBaseDigits(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/[\s\-\(\)\.\/\\]/g, '').trim();
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  const digits = cleaned.replace(/\D/g, '');

  if (digits.startsWith('0092')) {
    return digits.substring(4);
  }
  if (digits.startsWith('92')) {
    return digits.substring(2);
  }
  if (digits.startsWith('0')) {
    return digits.substring(1);
  }
  return digits;
}

/**
 * Analyzes and rigorously normalizes any Pakistani phone number.
 */
export function parsePakistanPhone(rawPhone: string): PakistanPhoneAnalysis {
  const defaultInvalid: PakistanPhoneAnalysis = {
    isValid: false,
    type: 'unknown',
    raw: rawPhone || '',
    domesticDisplay: '',
    domesticRaw: '',
    e164: '',
    isLikelyWhatsAppCapable: false,
    notes: 'Invalid or missing phone number'
  };

  if (!rawPhone || typeof rawPhone !== 'string') return defaultInvalid;

  // Basic sanity check against repetitiveness / dummy values
  const allDigits = rawPhone.replace(/\D/g, '');
  if (allDigits.length < 6 || allDigits.length > 15) return defaultInvalid;
  if (/^(\d)\1+$/.test(allDigits)) return defaultInvalid;
  if (/(\d)\1{5,}/.test(allDigits)) return defaultInvalid; // 6 consecutive identical numbers
  if (['123456789', '1234567890', '0123456789', '9876543210'].includes(allDigits)) return defaultInvalid;

  // UAN check (e.g. 111-123-456 or 021-111-123-456)
  if (/111\d{6}$/.test(allDigits)) {
    const uanPart = allDigits.slice(-9);
    const uanDisplay = `${uanPart.slice(0, 3)}-${uanPart.slice(3, 6)}-${uanPart.slice(6)}`;
    return {
      isValid: true,
      type: 'uan',
      raw: rawPhone,
      domesticDisplay: `021-${uanDisplay}`, // typically city-prefixed
      domesticRaw: `021${uanPart}`,
      e164: `+9221${uanPart}`,
      cityOrOperator: 'Universal Access Number (UAN)',
      isLikelyWhatsAppCapable: false,
      notes: 'UAN Commercial Contact'
    };
  }

  // Toll-Free check (0800-xxxxx)
  if (allDigits.startsWith('0800') || allDigits.startsWith('800')) {
    const tfDigits = allDigits.startsWith('0') ? allDigits : `0${allDigits}`;
    return {
      isValid: true,
      type: 'toll_free',
      raw: rawPhone,
      domesticDisplay: `${tfDigits.slice(0, 4)}-${tfDigits.slice(4)}`,
      domesticRaw: tfDigits,
      e164: `+92${tfDigits.substring(1)}`,
      cityOrOperator: 'Toll-Free',
      isLikelyWhatsAppCapable: false,
      notes: 'National Toll-Free line'
    };
  }

  const baseDigits = extractPakistaniBaseDigits(rawPhone);

  // Check 1: Mobile (starts with 3, total 10 base digits e.g. 3001234567)
  if (baseDigits.startsWith('3') && (baseDigits.length === 10 || baseDigits.length === 9)) {
    const full10 = baseDigits.length === 9 ? `3${baseDigits}` : baseDigits;
    const domestic = `0${full10}`;
    const prefix = domestic.substring(0, 4);
    const operator = PAK_MOBILE_OPERATORS[prefix] || 'Pakistani Mobile Network';

    return {
      isValid: true,
      type: 'mobile',
      raw: rawPhone,
      domesticDisplay: `${prefix}-${domestic.substring(4)}`,
      domesticRaw: domestic,
      e164: `+92${full10}`,
      cityOrOperator: operator,
      isLikelyWhatsAppCapable: true,
      notes: `Verified Pakistan Mobile (${operator}). Highly likely WhatsApp capable.`
    };
  }

  // Check 2: Landline via area code mapping
  const withZero = `0${baseDigits}`;
  
  // Try matching 4-digit area codes first (e.g. 0544, 05822), then 3-digit (021, 042, 051)
  const candidateCodes = Object.keys(PAK_LANDLINE_AREA_CODES).sort((a, b) => b.length - a.length);
  for (const code of candidateCodes) {
    if (withZero.startsWith(code)) {
      const { city, digitsAfterArea } = PAK_LANDLINE_AREA_CODES[code];
      const subscriberNumber = withZero.substring(code.length);

      // Validate length: exact or off by at most 1 digit due to legacy expansion
      if (Math.abs(subscriberNumber.length - digitsAfterArea) <= 1 && subscriberNumber.length >= 5) {
        return {
          isValid: true,
          type: 'landline',
          raw: rawPhone,
          domesticDisplay: `${code}-${subscriberNumber}`,
          domesticRaw: withZero,
          e164: `+92${baseDigits}`,
          cityOrOperator: `${city} Landline`,
          isLikelyWhatsAppCapable: false,
          notes: `Fixed-line telephone for ${city}. WhatsApp unlikely unless registered as WhatsApp Business landline.`
        };
      }
    }
  }

  // Fallback for valid digits starting with 0
  if (withZero.length >= 10 && withZero.length <= 12) {
    return {
      isValid: true,
      type: 'unknown',
      raw: rawPhone,
      domesticDisplay: withZero,
      domesticRaw: withZero,
      e164: `+92${baseDigits}`,
      cityOrOperator: 'Pakistan General',
      isLikelyWhatsAppCapable: false,
      notes: 'Pakistani phone number (unclassified carrier/area)'
    };
  }

  return defaultInvalid;
}

/**
 * Formats a Pakistani phone string strictly for Excel / UI:
 * Preserves the leading '0' (e.g., "0300-1234567" or "021-34567890").
 */
export function formatPakistanPhoneForExport(phone: string): string {
  const analysis = parsePakistanPhone(phone);
  if (!analysis.isValid) return phone?.trim() || '';
  return analysis.domesticDisplay || analysis.domesticRaw;
}

/**
 * Formats a Pakistani phone strictly as digits with leading zero (e.g., "03001234567").
 */
export function getPakistanDomesticRaw(phone: string): string {
  const analysis = parsePakistanPhone(phone);
  if (!analysis.isValid) return phone?.replace(/\D/g, '') || '';
  return analysis.domesticRaw;
}
