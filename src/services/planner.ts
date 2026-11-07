/**
 * Search Planner Module (Pakistan-First & Worldwide)
 * Breaks country, province, niche, and sub-niche requests into targeted geographic clusters,
 * localized business terminology, and varied query strategies.
 * Supports multi-city targeting and systematic multi-city matrix search for "All Pakistan".
 */

import {
  findCountry,
  ALL_PAKISTAN_SYSTEMATIC_CITIES,
  PAKISTAN_PROVINCES,
  UK_REGIONS,
  US_STATES,
} from '../lib/countries';
import { findTargetIndustry, isECommerceNiche } from '../lib/pakistanIndustries';
import { SearchPlan, SearchQueryPlan } from '../types';

export interface SearchPlanOptions {
  subNiche?: string;
  customSearchTerms?: string[];
  province?: string;
  qualificationFilters?: {
    requireNoWebsite?: boolean;
    allowWeakWebsite?: boolean;
    requireHiring?: boolean;
    minQualityScore?: number;
  };
}

export function createSearchPlan(
  countryInput: string = 'Pakistan',
  nicheInput: string,
  locationInput?: string,
  requestedCount: number = 10,
  options?: SearchPlanOptions
): SearchPlan {
  const isCombinedUKUSA = countryInput.toLowerCase().includes('uk + usa') || countryInput.toLowerCase().includes('uk & us');
  const isAllEnabledMarkets = countryInput.toLowerCase().includes('all enabled');
  const country = findCountry(countryInput) || findCountry('Pakistan');
  const countryName = isCombinedUKUSA ? 'UK + USA' : isAllEnabledMarkets ? 'All enabled markets' : country?.name || (countryInput?.trim() || 'Pakistan');
  const nicheClean = nicheInput?.trim() || 'Rent-a-Car';
  const subNicheClean = options?.subNiche?.trim() || '';
  const isPakistan = countryName.toLowerCase() === 'pakistan' || country?.code === 'PK';
  const isUK = countryName.toLowerCase().includes('united kingdom') || country?.code === 'GB';
  const isUS = countryName.toLowerCase().includes('united states') || country?.code === 'US';

  // Target candidate pool size: 2.5x - 4x requested count to allow for deduplication & QC rejection
  const poolMultiplier = requestedCount <= 20 ? 3.2 : requestedCount <= 50 ? 2.8 : 2.5;
  const candidateTargetPoolSize = Math.max(25, Math.ceil(requestedCount * poolMultiplier));

  // Determine locations to target
  let targetLocations: string[] = [];

  const rawLocation = (locationInput || '').trim();
  const isAllPakistan =
    rawLocation.toLowerCase().includes('all pakistan') ||
    rawLocation.toLowerCase() === 'pakistan' ||
    rawLocation.toLowerCase().includes('entire pakistan') ||
    rawLocation.toLowerCase().includes('multi-city');

  if (isPakistan && isAllPakistan) {
    // Systematic search across major commercial hubs in Pakistan
    targetLocations = [...ALL_PAKISTAN_SYSTEMATIC_CITIES];
  } else if (rawLocation.includes(',') || rawLocation.includes(';')) {
    // Multiple cities specified by user
    targetLocations = rawLocation
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (rawLocation) {
    targetLocations = [rawLocation];
  } else if (options?.province && isPakistan) {
    // Province selected without specific city
    const prov = PAKISTAN_PROVINCES.find(
      (p) => p.name.toLowerCase() === options.province?.toLowerCase() || p.code.toLowerCase() === options.province?.toLowerCase()
    );
    if (prov && prov.cities.length > 0) {
      targetLocations = prov.cities.slice(0, 4);
    } else {
      targetLocations = [options.province];
    }
  } else if (options?.province && isUK) {
    // UK Region / Nation selected
    const ukReg = UK_REGIONS.find(
      (r) =>
        r.name.toLowerCase().includes(options.province?.toLowerCase() || '') ||
        r.nation.toLowerCase().includes(options.province?.toLowerCase() || '') ||
        r.code.toLowerCase() === options.province?.toLowerCase()
    );
    if (ukReg && ukReg.majorCities.length > 0) {
      targetLocations = ukReg.majorCities.slice(0, 4);
    } else {
      targetLocations = [options.province];
    }
  } else if (options?.province && isUS) {
    // US State selected
    const usSt = US_STATES.find(
      (s) =>
        s.name.toLowerCase() === options.province?.toLowerCase() ||
        s.code.toLowerCase() === options.province?.toLowerCase()
    );
    if (usSt && usSt.majorCities.length > 0) {
      targetLocations = usSt.majorCities.slice(0, 4);
    } else {
      targetLocations = [options.province];
    }
  } else if (isCombinedUKUSA) {
    // UK + USA balanced mix of premier commercial centres
    targetLocations = ['London', 'New York', 'Manchester', 'Los Angeles', 'Birmingham', 'Chicago', 'Leeds', 'Houston'];
  } else if (isAllEnabledMarkets) {
    targetLocations = ['Karachi', 'London', 'New York', 'Lahore', 'Manchester', 'Los Angeles'];
  } else if (country && country.majorCities.length > 0) {
    // Default major cities
    const numCities = Math.min(country.majorCities.length, Math.max(3, Math.ceil(requestedCount / 10)));
    targetLocations = country.majorCities.filter((c) => !c.includes('All Pakistan')).slice(0, numCities);
  } else {
    targetLocations = [countryName];
  }

  // Determine localized terms and commercial variations dynamically
  const localTerms: string[] = [];
  if (country?.localTerms) {
    const combinedNiche = `${nicheClean} ${subNicheClean}`.toLowerCase();
    for (const [key, terms] of Object.entries(country.localTerms)) {
      if (combinedNiche.includes(key) || key.includes(nicheClean.toLowerCase())) {
        localTerms.push(...terms.split(' '));
      }
    }
  }

  // Pakistan Target Industry Specialized Keywords (Section 2 & 4)
  if (isPakistan) {
    const targetInd = findTargetIndustry(nicheClean);
    if (targetInd) {
      for (const kw of targetInd.localDiscoveryKeywords) {
        if (!localTerms.includes(kw)) {
          localTerms.push(kw);
        }
      }
    }
  }

  // Include user custom search terms if provided
  if (options?.customSearchTerms && options.customSearchTerms.length > 0) {
    for (const t of options.customSearchTerms) {
      const cleanT = t.trim();
      if (cleanT && !localTerms.includes(cleanT)) {
        localTerms.push(cleanT);
      }
    }
  }

  // Check if niche is E-Commerce / D2C / Brand
  const isEcom = isECommerceNiche(nicheClean) || isECommerceNiche(subNicheClean);
  const effectiveTerm = subNicheClean && !subNicheClean.toLowerCase().includes(nicheClean.toLowerCase())
    ? `${subNicheClean} ${nicheClean}`
    : subNicheClean || nicheClean;

  // Commercial prefixes and angles: specialized for E-Commerce vs Service providers
  const commercialPrefixes = isEcom
    ? [
        `${effectiveTerm} online store`,
        `Pakistani ${effectiveTerm} online shopping`,
        `${effectiveTerm} official website`,
        `best ${effectiveTerm} brands`,
        `${effectiveTerm} D2C brand order online`,
        `Instagram ${effectiveTerm} brands buy online`,
        `top ${effectiveTerm} brands`,
        `${effectiveTerm} cash on delivery`,
      ]
    : [
        subNicheClean ? `${subNicheClean} ${nicheClean}` : `${nicheClean}`,
        `${nicheClean} services`,
        `${nicheClean} company`,
        `${nicheClean} agency`,
        `best ${nicheClean}`,
        `top ${nicheClean}`,
        `commercial ${nicheClean}`,
        `verified ${nicheClean}`,
      ];

  const queries: SearchQueryPlan[] = [];

  // Generate varied query strategies for each target location
  for (const loc of targetLocations) {
    const queryCountPerLocation = requestedCount >= 50 ? 6 : requestedCount >= 20 ? 4 : 2;

    for (let i = 0; i < queryCountPerLocation; i++) {
      const variant = commercialPrefixes[i % commercialPrefixes.length];
      const variantTerm = localTerms.length > 0 ? localTerms[i % localTerms.length] : variant;

      if (i === 0) {
        queries.push({
          query: `${variant} in ${loc} ${countryName}`,
          location: loc,
          targetFocus: 'Direct commercial query',
          terminology: nicheClean,
        });
      } else if (i === 1) {
        queries.push({
          query: `${variantTerm} ${loc} ${countryName}`,
          location: loc,
          targetFocus: 'Local providers & contractors',
          terminology: variantTerm,
        });
      } else if (i === 2) {
        queries.push({
          query: subNicheClean ? `${subNicheClean} ${loc} ${countryName}` : `${variant} ${loc}`,
          location: loc,
          targetFocus: 'City-level commercial query',
          terminology: subNicheClean || variant,
        });
      } else {
        queries.push({
          query: `${variant} ${loc} ${countryName}`,
          location: loc,
          targetFocus: `Specialized commercial angle ${i + 1}`,
          terminology: variant,
        });
      }
    }
  }

  return {
    country: countryName,
    niche: nicheClean,
    subNiche: subNicheClean || undefined,
    customSearchTerms: options?.customSearchTerms,
    regions: targetLocations,
    queries,
    localTerminologyUsed: Array.from(new Set(localTerms)),
    candidateTargetPoolSize,
    qualificationFilters: options?.qualificationFilters,
  };
}
