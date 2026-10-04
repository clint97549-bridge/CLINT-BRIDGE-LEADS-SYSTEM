/**
 * Search Planner Module (Phase 3 & 8)
 * Breaks country and niche requests into targeted geographic clusters,
 * localized business terminology, and varied query strategies.
 */

import { findCountry } from '../lib/countries';
import { SearchPlan, SearchQueryPlan } from '../types';

export function createSearchPlan(
  countryInput: string,
  nicheInput: string,
  locationInput?: string,
  requestedCount: number = 10
): SearchPlan {
  const country = findCountry(countryInput);
  const countryName = country?.name || countryInput;
  const nicheClean = nicheInput.trim();

  // Target candidate pool size: 2x - 3x requested count to allow for deduplication & QC rejection
  const poolMultiplier = requestedCount <= 25 ? 2.5 : requestedCount <= 100 ? 2.0 : 1.5;
  const candidateTargetPoolSize = Math.max(15, Math.ceil(requestedCount * poolMultiplier));

  // Determine locations to target
  let targetLocations: string[] = [];

  if (locationInput && locationInput.trim()) {
    targetLocations = [locationInput.trim()];
  } else if (country && country.majorCities.length > 0) {
    // Choose proportional number of cities based on count
    const numCities = Math.min(country.majorCities.length, Math.max(3, Math.ceil(requestedCount / 10)));
    targetLocations = country.majorCities.slice(0, numCities);
  } else {
    targetLocations = [countryName];
  }

  // Determine localized terms
  const localTerms: string[] = [];
  if (country?.localTerms) {
    const nicheLower = nicheClean.toLowerCase();
    for (const [key, terms] of Object.entries(country.localTerms)) {
      if (nicheLower.includes(key) || key.includes(nicheLower)) {
        localTerms.push(...terms.split(' '));
      }
    }
  }

  const queries: SearchQueryPlan[] = [];

  // Generate varied query strategies for each target location
  for (const loc of targetLocations) {
    // 1. Direct commercial query
    queries.push({
      query: `top ${nicheClean} in ${loc} ${countryName} official website phone address`,
      location: loc,
      targetFocus: 'Commercial directory & official sites',
      terminology: nicheClean,
    });

    // 2. Local services query
    const variantTerm = localTerms.length > 0 ? localTerms[0] : nicheClean;
    queries.push({
      query: `${variantTerm} companies ${loc} ${countryName} business contact`,
      location: loc,
      targetFocus: 'Local contractors & services',
      terminology: variantTerm,
    });

    // 3. Independent/specialist businesses query
    queries.push({
      query: `independent ${nicheClean} services ${loc} reviews website`,
      location: loc,
      targetFocus: 'Established independent businesses',
      terminology: nicheClean,
    });
  }

  return {
    country: countryName,
    niche: nicheClean,
    regions: targetLocations,
    queries,
    localTerminologyUsed: localTerms,
    candidateTargetPoolSize,
  };
}
