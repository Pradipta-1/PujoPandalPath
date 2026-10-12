import type { Pandal } from '../types/pandal';

/**
 * Normalizes text for Kolkata/Bengali English phonetic variations.
 * Handles common transliteration variants:
 * - sh / s / sree / shree
 * - ee / i
 * - oo / u
 * - bh / b / v
 * - gh / g
 * - dh / d
 * - th / t
 * - kh / k
 * - ph / p / f
 * - ch / c
 * - or / ar (e.g. Kumartuli / Kumortuli)
 */
export function phoneticNormalize(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/sh/g, 's')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/bh/g, 'b')
    .replace(/gh/g, 'g')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/kh/g, 'k')
    .replace(/ph/g, 'p')
    .replace(/v/g, 'b')
    .replace(/y/g, 'i')
    .replace(/ch/g, 'c')
    .replace(/aa/g, 'a')
    .replace(/or/g, 'ar')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Evaluates whether a pandal matches the search query and calculates a relevance score.
 */
export function scorePandalMatch(pandal: Pandal, query: string): { match: boolean; score: number } {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) {
    return { match: true, score: 0 };
  }

  const tokens = cleanQ.split(/\s+/).filter(Boolean);
  const nameLower = pandal.name.toLowerCase();
  const metroLower = (pandal.nearest_metro || '').toLowerCase();
  const divLower = (pandal.area_division || '').toLowerCase();
  const notesLower = (pandal.notes || '').toLowerCase();
  const categoryLower = (pandal.category || '').toLowerCase();

  const namePhonetic = phoneticNormalize(pandal.name);
  const metroPhonetic = phoneticNormalize(pandal.nearest_metro);
  const divPhonetic = phoneticNormalize(pandal.area_division);
  const notesPhonetic = phoneticNormalize(pandal.notes || '');

  let totalScore = 0;

  // Whole query exact prefix on name (highest possible priority)
  if (nameLower.startsWith(cleanQ)) {
    totalScore += 2000;
  } else if (namePhonetic.startsWith(phoneticNormalize(cleanQ))) {
    totalScore += 1800;
  }

  // Check each token
  for (const token of tokens) {
    const tokenPhonetic = phoneticNormalize(token);
    let tokenMatched = false;

    // 1. Direct match on pandal name
    if (nameLower.startsWith(token)) {
      totalScore += 800;
      tokenMatched = true;
    } else if (nameLower.includes(` ${token}`) || nameLower.includes(`-${token}`)) {
      totalScore += 700; // Word-boundary start match in name
      tokenMatched = true;
    } else if (nameLower.includes(token)) {
      totalScore += 500;
      tokenMatched = true;
    } else if (tokenPhonetic && namePhonetic.startsWith(tokenPhonetic)) {
      totalScore += 750; // Phonetic prefix match (e.g. 'shree' -> 'Sreebhumi')
      tokenMatched = true;
    } else if (tokenPhonetic && namePhonetic.includes(tokenPhonetic)) {
      totalScore += 400; // Phonetic substring match
      tokenMatched = true;
    }

    // 2. Nearest Metro match
    if (metroLower.startsWith(token)) {
      totalScore += 300;
      tokenMatched = true;
    } else if (metroLower.includes(token) || (tokenPhonetic && metroPhonetic.includes(tokenPhonetic))) {
      totalScore += 200;
      tokenMatched = true;
    }

    // 3. Area Division match
    if (divLower.includes(token) || (tokenPhonetic && divPhonetic.includes(tokenPhonetic))) {
      totalScore += 150;
      tokenMatched = true;
    }

    // 4. Category match
    if (categoryLower.includes(token)) {
      totalScore += 100;
      tokenMatched = true;
    }

    // 5. Route notes match
    if (notesLower.includes(token) || (tokenPhonetic && notesPhonetic.includes(tokenPhonetic))) {
      totalScore += 80;
      tokenMatched = true;
    }

    // If any token fails to match ANY field, this pandal is excluded
    if (!tokenMatched) {
      return { match: false, score: 0 };
    }
  }

  // Bonus for verified destination coordinates
  if (pandal.location_verified) {
    totalScore += 20;
  }

  return { match: true, score: totalScore };
}

/**
 * Searches and ranks pandals by query relevance.
 */
export function searchPandals(pandals: Pandal[], query: string): Pandal[] {
  const cleanQ = query.trim();
  if (!cleanQ) return pandals;

  return pandals
    .map((pandal) => ({
      pandal,
      scoring: scorePandalMatch(pandal, cleanQ)
    }))
    .filter((item) => item.scoring.match)
    .sort((a, b) => b.scoring.score - a.scoring.score)
    .map((item) => item.pandal);
}
