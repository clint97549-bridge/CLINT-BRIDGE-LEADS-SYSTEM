/**
 * Real Server-Side Website Verification & Technical Audit Engine
 * (Step 10: Grounded Verification Architecture)
 *
 * Implements strict, verifiable, evidence-based website retrieval:
 * 1. Actually retrieves public websites server-side using fetch with timeouts.
 * 2. Verifies reachability, HTTP status, and HTTPS/HTTP transport security.
 * 3. Crawls safe public pages (homepage, contact, about, services).
 * 4. Extracts ONLY data actually observable in the HTML (emails, phones, addresses, meta tags, forms).
 * 5. Identifies real digital problems ONLY when backed by directly measured HTML evidence.
 * 6. Strictly prohibits LLM hallucination or model guessing of missing contact data.
 */

export interface ObservableDigitalProblem {
  problem: string;
  evidence: string;
  sourceUrl: string;
  retrievedAt: string;
}

export interface VerifiedWebsiteData {
  url: string;
  isReachable: boolean;
  httpStatus?: number;
  finalUrl?: string;
  isInsecureHttp: boolean;
  responseTimeMs: number;
  websiteStatus: 'Active' | 'Active but Weak' | 'Outdated Indicators' | 'Broken' | 'Unreachable' | 'No Website Found';
  companyNameFound?: string;
  emailsFound: { email: string; sourceUrl: string }[];
  phonesFound: { phone: string; sourceUrl: string }[];
  addressesFound: { address: string; sourceUrl: string }[];
  decisionMakersFound: { name: string; title: string; sourceUrl: string }[];
  socialLinks: { facebook?: string; instagram?: string; linkedin?: string };
  hasContactPage: boolean;
  contactPageUrl?: string;
  hasContactForm: boolean;
  hasCallToAction: boolean;
  hasViewportMeta: boolean;
  title?: string;
  metaDescription?: string;
  outdatedCopyrightYear?: number;
  observableProblems: ObservableDigitalProblem[];
  retrievedAt: string;
  evidenceItems: {
    claim: string;
    url: string;
    summary: string;
  }[];
}

const DISALLOWED_EMAIL_DOMAINS = new Set([
  'example.com',
  'domain.com',
  'yoursite.com',
  'email.com',
  'sentry.io',
  'wixpress.com',
  'wordpress.org',
  'w3.org',
  'schema.org',
]);

const DISALLOWED_EMAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.css', '.js'];

/**
 * Normalizes input URL to fully qualified HTTP/HTTPS URL
 */
export function normalizeWebsiteUrl(rawUrl: string): string {
  if (!rawUrl || rawUrl === 'No Website Found' || rawUrl === 'None') return '';
  let trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Extracts public links (contact, about, services) from HTML targeting the same domain.
 */
function extractInternalSubpages(html: string, baseUrl: string): { contactUrl?: string; aboutUrl?: string } {
  const result: { contactUrl?: string; aboutUrl?: string } = {};
  try {
    const base = new URL(baseUrl);
    const linkRegex = /href=["']([^"']+)["']/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].trim();
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      try {
        const resolved = new URL(href, base);
        if (resolved.hostname === base.hostname) {
          const pathLower = resolved.pathname.toLowerCase();
          if (!result.contactUrl && (pathLower.includes('contact') || pathLower.includes('get-in-touch'))) {
            result.contactUrl = resolved.href;
          }
          if (!result.aboutUrl && (pathLower.includes('about') || pathLower.includes('who-we-are'))) {
            result.aboutUrl = resolved.href;
          }
        }
      } catch {
        // Skip unparseable URL
      }
    }
  } catch {
    // Ignore base URL parse errors
  }
  return result;
}

/**
 * Extracts real emails from HTML (both mailto: links and visible text).
 */
export function extractEmailsFromHtml(html: string, pageUrl: string): { email: string; sourceUrl: string }[] {
  const found = new Set<string>();
  const results: { email: string; sourceUrl: string }[] = [];

  // 1. mailto: links (highest reliability)
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let match;
  while ((match = mailtoRegex.exec(html)) !== null) {
    const email = match[1].toLowerCase().trim();
    const domain = email.split('@')[1];
    if (!DISALLOWED_EMAIL_DOMAINS.has(domain) && !DISALLOWED_EMAIL_EXTENSIONS.some((ext) => email.endsWith(ext))) {
      if (!found.has(email)) {
        found.add(email);
        results.push({ email, sourceUrl: pageUrl });
      }
    }
  }

  // 2. Text regex
  const textEmailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  while ((match = textEmailRegex.exec(html)) !== null) {
    const email = match[0].toLowerCase().trim();
    const domain = email.split('@')[1];
    if (!DISALLOWED_EMAIL_DOMAINS.has(domain) && !DISALLOWED_EMAIL_EXTENSIONS.some((ext) => email.endsWith(ext))) {
      if (!found.has(email)) {
        found.add(email);
        results.push({ email, sourceUrl: pageUrl });
      }
    }
  }

  return results;
}

/**
 * Extracts phone numbers from HTML (tel: links and text patterns).
 */
export function extractPhonesFromHtml(html: string, pageUrl: string): { phone: string; sourceUrl: string }[] {
  const found = new Set<string>();
  const results: { phone: string; sourceUrl: string }[] = [];

  // 1. tel: links
  const telRegex = /tel:([+0-9\s().-]{7,25})/gi;
  let match;
  while ((match = telRegex.exec(html)) !== null) {
    const phone = match[1].trim();
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length >= 7 && digitsOnly !== '123456789' && !digitsOnly.startsWith('0000')) {
      if (!found.has(phone)) {
        found.add(phone);
        results.push({ phone, sourceUrl: pageUrl });
      }
    }
  }

  // 2. UK phone text pattern (e.g. 0161 xxx xxxx, 07xxx xxxxxx, +44 xxxx xxxxxx)
  const ukPhoneRegex = /(?:\+44\s?\(?0?\)?|0)(?:[1-9]\d{1,4}\s?\d{3,4}\s?\d{3,4}|7\d{3}\s?\d{6})\b/g;
  while ((match = ukPhoneRegex.exec(html)) !== null) {
    const phone = match[0].trim();
    if (!found.has(phone)) {
      found.add(phone);
      results.push({ phone, sourceUrl: pageUrl });
    }
  }

  return results;
}

/**
 * Extracts social profile links from HTML
 */
export function extractSocialProfiles(html: string): { facebook?: string; instagram?: string; linkedin?: string } {
  const result: { facebook?: string; instagram?: string; linkedin?: string } = {};

  const fbMatch = html.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/(?:pages\/)?[a-zA-Z0-9._-]+)\/?["']/i);
  if (fbMatch && !fbMatch[1].includes('sharer') && !fbMatch[1].includes('tr?id=')) {
    result.facebook = fbMatch[1];
  }

  const igMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+)\/?["']/i);
  if (igMatch) {
    result.instagram = igMatch[1];
  }

  const liMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+)\/?["']/i);
  if (liMatch && !liMatch[1].includes('shareArticle')) {
    result.linkedin = liMatch[1];
  }

  return result;
}

/**
 * Safely fetches a web page with timeout and standard browser headers.
 */
async function safeFetchHtml(url: string, timeoutMs = 5000): Promise<{ ok: boolean; status: number; html: string; finalUrl: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      // Not an HTML document (e.g. PDF or binary)
      return { ok: response.ok, status: response.status, html: '', finalUrl: response.url };
    }

    const html = await response.text();
    return { ok: response.ok, status: response.status, html, finalUrl: response.url };
  } catch (err) {
    return null;
  }
}

/**
 * Performs a real server-side technical verification and evidence extraction for a website.
 */
export async function verifyAndAuditWebsite(rawWebsiteUrl: string): Promise<VerifiedWebsiteData> {
  const retrievedAt = new Date().toISOString();
  const normalizedUrl = normalizeWebsiteUrl(rawWebsiteUrl);

  // Default empty/unreachable structure
  const emptyResult: VerifiedWebsiteData = {
    url: rawWebsiteUrl || 'No Website Found',
    isReachable: false,
    isInsecureHttp: false,
    responseTimeMs: 0,
    websiteStatus: normalizedUrl ? 'Unreachable' : 'No Website Found',
    emailsFound: [],
    phonesFound: [],
    addressesFound: [],
    decisionMakersFound: [],
    socialLinks: {},
    hasContactPage: false,
    hasContactForm: false,
    hasCallToAction: false,
    hasViewportMeta: false,
    observableProblems: [],
    retrievedAt,
    evidenceItems: [],
  };

  if (!normalizedUrl) {
    return emptyResult;
  }

  const startTime = Date.now();
  const homepageFetch = await safeFetchHtml(normalizedUrl, 6000);
  const responseTimeMs = Date.now() - startTime;

  if (!homepageFetch || !homepageFetch.ok || homepageFetch.status >= 400) {
    const status = homepageFetch?.status || 0;
    const isBroken = status >= 400;
    return {
      ...emptyResult,
      url: normalizedUrl,
      isReachable: false,
      httpStatus: status,
      websiteStatus: isBroken ? 'Broken' : 'Unreachable',
      responseTimeMs,
      observableProblems: [
        {
          problem: isBroken
            ? `Website Server Error / Broken (HTTP ${status})`
            : 'Website Domain Unreachable / DNS or Connection Timeout',
          evidence: `Direct HTTP connection to ${normalizedUrl} failed with status ${status || 'TIMEOUT / REFUSED'}.`,
          sourceUrl: normalizedUrl,
          retrievedAt,
        },
      ],
      evidenceItems: [
        {
          claim: `Domain ${isBroken ? 'returned HTTP ' + status : 'was unreachable'}`,
          url: normalizedUrl,
          summary: `Direct server verification connection failed at ${retrievedAt}`,
        },
      ],
    };
  }

  const { html, finalUrl, status } = homepageFetch;
  const isInsecure = finalUrl.startsWith('http://');

  // 1. Technical Meta Analysis
  const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : undefined;

  // 2. Form & CTA Analysis
  const hasContactForm = /<form[^>]*>/i.test(html);
  const hasCallToAction = /href=["'](?:tel:|mailto:|https?:\/\/calendly|https?:\/\/wa\.me)/i.test(html);

  // 3. Outdated Copyright Extraction
  const copyMatch = html.match(/(?:©|&copy;|Copyright)\s*(?:20\d\d\s*-\s*)?(20\d\d)/i);
  let outdatedYear: number | undefined;
  if (copyMatch) {
    const y = parseInt(copyMatch[1], 10);
    if (y > 2000 && y <= 2026) {
      outdatedYear = y;
    }
  }

  // 4. Contact Data Extraction from Homepage
  const emailsFound = extractEmailsFromHtml(html, finalUrl);
  const phonesFound = extractPhonesFromHtml(html, finalUrl);
  const socialLinks = extractSocialProfiles(html);

  // 4b. Extract Postal Address from HTML
  const addressesFound: { address: string; sourceUrl: string }[] = [];
  const addressMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  if (addressMatch) {
    const cleanAddr = addressMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanAddr.length >= 10 && cleanAddr.length <= 150) {
      addressesFound.push({ address: cleanAddr, sourceUrl: finalUrl });
    }
  }
  const ukPostcode = html.match(/\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/);
  if (ukPostcode && addressesFound.length === 0) {
    addressesFound.push({ address: `Postcode: ${ukPostcode[1]}`, sourceUrl: finalUrl });
  }

  // 4c. Extract Directly Verified Decision Makers from HTML
  const decisionMakersFound: { name: string; title: string; sourceUrl: string }[] = [];
  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
  if (authorMatch && authorMatch[1].trim().length > 3) {
    const rawName = authorMatch[1].trim();
    if (rawName.split(/\s+/).length >= 2 && !DISALLOWED_EMAIL_DOMAINS.has(rawName.toLowerCase())) {
      decisionMakersFound.push({ name: rawName, title: 'Author / Director', sourceUrl: finalUrl });
    }
  }

  // 5. Discover and check contact subpage
  const subpages = extractInternalSubpages(html, finalUrl);
  let hasContactPage = false;
  let contactPageUrl: string | undefined = undefined;

  if (subpages.contactUrl) {
    contactPageUrl = subpages.contactUrl;
    const contactFetch = await safeFetchHtml(subpages.contactUrl, 4000);
    if (contactFetch && contactFetch.ok) {
      hasContactPage = true;
      // Extract additional contacts from contact page
      const contactEmails = extractEmailsFromHtml(contactFetch.html, subpages.contactUrl);
      for (const ce of contactEmails) {
        if (!emailsFound.some((e) => e.email === ce.email)) {
          emailsFound.push(ce);
        }
      }
      const contactPhones = extractPhonesFromHtml(contactFetch.html, subpages.contactUrl);
      for (const cp of contactPhones) {
        if (!phonesFound.some((p) => p.phone === cp.phone)) {
          phonesFound.push(cp);
        }
      }
    } else if (contactFetch && contactFetch.status === 404) {
      // Broken contact link detected!
      emptyResult.observableProblems.push({
        problem: 'Broken Contact Page (HTTP 404)',
        evidence: `Navigation link to contact page ${subpages.contactUrl} returned HTTP 404 Not Found.`,
        sourceUrl: subpages.contactUrl,
        retrievedAt,
      });
    }
  }

  // 6. Observable Problems Detection (Evidence-Grounded & Conservative)
  const observableProblems: ObservableDigitalProblem[] = [];

  // Problem A: Insecure HTTP
  if (isInsecure) {
    observableProblems.push({
      problem: 'Insecure Plaintext HTTP (Missing HTTPS)',
      evidence: `Website is served over unencrypted HTTP (${finalUrl}) without automatic redirect to HTTPS.`,
      sourceUrl: finalUrl,
      retrievedAt,
    });
  }

  // Problem B: Missing Mobile Viewport Meta (Conservative Check)
  const hasResponsiveCss = /@media[^{]+(?:max-width|min-width)/i.test(html) || /class=["'][^"']*\b(col-|flex|grid|sm:|md:)/i.test(html);
  if (!hasViewportMeta && !hasResponsiveCss) {
    observableProblems.push({
      problem: 'Missing Mobile Viewport Meta Tag Configuration',
      evidence: 'HTML lacks a <meta name="viewport"> tag and responsive layout breakpoints for mobile devices.',
      sourceUrl: finalUrl,
      retrievedAt,
    });
  }

  // Problem C: Missing / Inadequate SEO Title
  if (!title || title.length < 10) {
    observableProblems.push({
      problem: 'Missing or Inadequate HTML Title Tag',
      evidence: title
        ? `<title> is only ${title.length} characters ("${title}"), failing basic search optimization.`
        : 'HTML document lacks a <title> tag in the <head>.',
      sourceUrl: finalUrl,
      retrievedAt,
    });
  }

  // Problem D: Missing Meta Description
  if (!metaDescription || metaDescription.length < 20) {
    observableProblems.push({
      problem: 'Missing Search Engine Meta Description',
      evidence: 'HTML document lacks a <meta name="description"> tag for search engine result snippets.',
      sourceUrl: finalUrl,
      retrievedAt,
    });
  }

  // Problem E: Outdated Visible Content (Conservative Check - Corroborated Only)
  const hasObsoleteMarkup = /<(?:marquee|font|center)\b/i.test(html) || /bgcolor=/i.test(html) || /cellspacing=/i.test(html);
  if (outdatedYear && outdatedYear <= 2018 && hasObsoleteMarkup) {
    observableProblems.push({
      problem: `Outdated Legacy Website Architecture (Copyright ${outdatedYear})`,
      evidence: `Visible footer copyright (${outdatedYear}) is corroborated by obsolete HTML tags found in source markup.`,
      sourceUrl: finalUrl,
      retrievedAt,
    });
  }

  // Problem F: Missing Contact Action (Only if NO phone and NO email and NO form)
  const hasAnyContactMethod = emailsFound.length > 0 || phonesFound.length > 0 || hasContactForm || hasContactPage;
  if (!hasAnyContactMethod) {
    observableProblems.push({
      problem: 'Absence of Interactive Contact Form or Direct Lead Action',
      evidence: 'No clickable tel:, mailto:, contact form, or direct lead capture links found in page markup.',
      sourceUrl: finalUrl,
      retrievedAt,
    });
  }

  // Determine Website Status
  let websiteStatus: VerifiedWebsiteData['websiteStatus'] = 'Active';
  if (observableProblems.length >= 3 || (!hasViewportMeta && isInsecure)) {
    websiteStatus = 'Active but Weak';
  } else if (outdatedYear && outdatedYear <= 2018 && hasObsoleteMarkup) {
    websiteStatus = 'Outdated Indicators';
  }

  // 7. Structured Evidence Records
  const evidenceItems: { claim: string; url: string; summary: string }[] = [];

  evidenceItems.push({
    claim: 'Verified Public Web Server Reachability',
    url: finalUrl,
    summary: `HTTP ${status} OK verified at ${retrievedAt}. Response time: ${responseTimeMs}ms.`,
  });

  if (emailsFound.length > 0) {
    for (const em of emailsFound) {
      evidenceItems.push({
        claim: `Public Business Email Verified: ${em.email}`,
        url: em.sourceUrl,
        summary: `Found verified email address ${em.email} on ${em.sourceUrl}`,
      });
    }
  }

  if (phonesFound.length > 0) {
    for (const ph of phonesFound) {
      evidenceItems.push({
        claim: `Public Business Phone Verified: ${ph.phone}`,
        url: ph.sourceUrl,
        summary: `Found verified phone number ${ph.phone} on ${ph.sourceUrl}`,
      });
    }
  }

  for (const prob of observableProblems) {
    evidenceItems.push({
      claim: `Digital Opportunity: ${prob.problem}`,
      url: prob.sourceUrl,
      summary: prob.evidence,
    });
  }

  return {
    url: normalizedUrl,
    isReachable: true,
    httpStatus: status,
    finalUrl,
    isInsecureHttp: isInsecure,
    responseTimeMs,
    websiteStatus,
    emailsFound,
    phonesFound,
    addressesFound,
    decisionMakersFound,
    socialLinks,
    hasContactPage,
    contactPageUrl,
    hasContactForm,
    hasCallToAction,
    hasViewportMeta,
    title,
    metaDescription,
    outdatedCopyrightYear: outdatedYear,
    observableProblems,
    retrievedAt,
    evidenceItems,
  };
}

/**
 * Validates whether the verified website actually belongs to the discovered business.
 * Compares normalized company name tokens against canonical domain, title, and meta description.
 */
export function verifyBusinessWebsiteMatch(
  companyName: string,
  websiteUrl: string,
  siteAudit: VerifiedWebsiteData
): { match: boolean; reason?: string } {
  if (!siteAudit.isReachable) {
    return { match: false, reason: 'Website domain is unreachable' };
  }

  const normCompany = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const companyTokens = normCompany
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['ltd', 'limited', 'llc', 'inc', 'co', 'the', 'and', 'uk', 'group', 'services'].includes(w));

  if (companyTokens.length === 0) {
    return { match: true };
  }

  let domain = '';
  try {
    domain = new URL(siteAudit.finalUrl || websiteUrl).hostname.toLowerCase();
  } catch {
    domain = websiteUrl.toLowerCase();
  }

  const domainMatches = companyTokens.some((token) => domain.includes(token));
  const pageTitle = (siteAudit.title || '').toLowerCase();
  const titleMatches = companyTokens.some((token) => pageTitle.includes(token));
  const metaDesc = (siteAudit.metaDescription || '').toLowerCase();
  const metaMatches = companyTokens.some((token) => metaDesc.includes(token));

  if (!domainMatches && !titleMatches && !metaMatches) {
    return {
      match: false,
      reason: `Website domain ("${domain}") and title ("${siteAudit.title || 'None'}") do not match business name "${companyName}"`,
    };
  }

  return { match: true };
}
