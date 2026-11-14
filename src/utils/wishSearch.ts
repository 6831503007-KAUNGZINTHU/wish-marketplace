import { Offer, Wish } from '../types';

export type SearchMatchTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface WishSearchMatch {
  wish: Wish;
  tier: SearchMatchTier;
  subScore: number;
}

export interface OfferSearchMatch {
  offer: Offer;
  tier: SearchMatchTier;
  subScore: number;
}

/**
 * Normalize whitespace and casing while keeping punctuation (e.g. "10.5", "WH-1000XM5").
 */
export function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normalize text by stripping non-alphanumeric punctuation (preserving Thai characters).
 */
export function normalizeAlphanumeric(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split normalized text into searchable word tokens.
 */
export function tokenizeSearchText(text: string): string[] {
  const normalized = normalizeAlphanumeric(text);
  return normalized ? normalized.split(' ') : [];
}

/**
 * Damerau-Levenshtein edit distance (supports insertions, deletions, substitutions,
 * and adjacent character transpositions like "iphoen" -> "iphone").
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;
  if (a === b) return 0;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array<number>(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        val = Math.min(val, dp[i - 2][j - 2] + cost); // transposition
      }

      dp[i][j] = val;
    }
  }

  return dp[lenA][lenB];
}

/**
 * Fuzzy similarity check for individual tokens with conservative thresholds
 * so minor typos ("iphon", "samsng", "iphoen") match without unrelated noise.
 */
export function getFuzzyTokenSimilarity(queryToken: string, targetToken: string): number {
  if (queryToken.length < 4 || targetToken.length < 4) {
    return 0;
  }

  const maxAllowedDistance = queryToken.length >= 7 ? 2 : 1;
  if (Math.abs(queryToken.length - targetToken.length) > maxAllowedDistance) {
    return 0;
  }

  const distance = damerauLevenshteinDistance(queryToken, targetToken);
  if (distance > maxAllowedDistance) {
    return 0;
  }

  const maxLen = Math.max(queryToken.length, targetToken.length);
  const similarity = 1 - distance / maxLen;
  return similarity >= 0.72 ? similarity : 0;
}

interface FieldIndex {
  raw: string;
  alnum: string;
  tokens: string[];
}

function buildFieldIndex(text: string): FieldIndex {
  const raw = normalizeSearchText(text);
  const alnum = normalizeAlphanumeric(text);
  const tokens = alnum ? alnum.split(' ') : [];
  return { raw, alnum, tokens };
}

function hasPhraseMatch(field: FieldIndex, rawQuery: string, alnumQuery: string): boolean {
  if (!field.raw) return false;
  if (field.raw.includes(rawQuery)) return true;
  if (alnumQuery && field.alnum.includes(alnumQuery)) return true;
  return false;
}

function hasDirectTokenMatch(field: FieldIndex, token: string): boolean {
  if (!field.raw) return false;
  if (field.raw.includes(token)) return true;
  if (field.alnum.includes(token)) return true;
  return false;
}

function hasWholeWordTokenMatch(field: FieldIndex, token: string): boolean {
  return field.tokens.includes(token);
}

function getBestFuzzyMatchForToken(
  token: string,
  fields: FieldIndex[]
): { similarity: number; fieldPriority: number } {
  let bestSim = 0;
  let bestFieldPriority = 0;

  fields.forEach((field, idx) => {
    // Give higher priority to title (0), brand (1), category (2) than description (3) / keywords (4)
    const priorityWeight = idx <= 2 ? 50 : 10;
    for (const targetToken of field.tokens) {
      const sim = getFuzzyTokenSimilarity(token, targetToken);
      if (sim > bestSim || (sim === bestSim && priorityWeight > bestFieldPriority)) {
        bestSim = sim;
        bestFieldPriority = priorityWeight;
      }
    }
  });

  return { similarity: bestSim, fieldPriority: bestFieldPriority };
}

/**
 * Evaluate and rank a single Wish against a normalized search query.
 * Returns null if the wish does not match.
 *
 * Ranking Tiers:
 * 1. Exact title match
 * 2. Title contains the search keyword/phrase
 * 3. Partial or multi-word title matches
 * 4. Brand and category matches (or combined title + brand/category token matches)
 * 5. Description and related keyword matches (or combined multi-field direct matches)
 * 6. Fuzzy matches (minor typos/misspellings)
 */
export function evaluateWishSearchMatch(wish: Wish, searchQuery: string): WishSearchMatch | null {
  const rawQuery = normalizeSearchText(searchQuery);
  if (!rawQuery) return null;

  const alnumQuery = normalizeAlphanumeric(searchQuery);
  const queryTokens = tokenizeSearchText(searchQuery);

  const titleField = buildFieldIndex(wish.title || '');
  const brandField = buildFieldIndex(wish.brand || '');
  const categoryField = buildFieldIndex(wish.category || '');
  const descriptionField = buildFieldIndex(wish.description || '');
  const keywordsText = Array.isArray(wish.keywords) ? wish.keywords.join(' ') : '';
  const keywordsField = buildFieldIndex(keywordsText);

  // 1. Exact title match
  if (
    titleField.raw === rawQuery ||
    (alnumQuery.length > 0 && titleField.alnum === alnumQuery)
  ) {
    return { wish, tier: 1, subScore: 1000 };
  }

  // 2. Title contains the search keyword / phrase
  if (hasPhraseMatch(titleField, rawQuery, alnumQuery)) {
    let subScore = 500;
    if (
      titleField.raw.startsWith(rawQuery) ||
      (alnumQuery && titleField.alnum.startsWith(alnumQuery))
    ) {
      subScore += 200;
    } else if (alnumQuery && (` ${titleField.alnum} `).includes(` ${alnumQuery} `)) {
      subScore += 170;
    } else if (alnumQuery && (` ${titleField.alnum}`).includes(` ${alnumQuery}`)) {
      subScore += 150;
    }
    if (queryTokens.length > 0) {
      const wholeWordHits = queryTokens.filter((t) => hasWholeWordTokenMatch(titleField, t)).length;
      subScore += wholeWordHits * 25;
      const keywordHits = queryTokens.filter(
        (t) => hasWholeWordTokenMatch(keywordsField, t) || hasDirectTokenMatch(keywordsField, t)
      ).length;
      subScore += keywordHits * 15;
    }
    const compactness = Math.round((rawQuery.length / Math.max(1, titleField.raw.length)) * 50);
    return { wish, tier: 2, subScore: subScore + compactness };
  }

  // 3. Partial or multi-word title matches (all tokens appear in title)
  if (
    queryTokens.length > 0 &&
    queryTokens.every((t) => hasDirectTokenMatch(titleField, t))
  ) {
    const wholeWordHits = queryTokens.filter((t) => hasWholeWordTokenMatch(titleField, t)).length;
    return { wish, tier: 3, subScore: 400 + wholeWordHits * 30 };
  }

  // 4. Brand and category matches
  const brandExact =
    brandField.raw.length > 0 &&
    (brandField.raw === rawQuery || (alnumQuery.length > 0 && brandField.alnum === alnumQuery));
  const categoryExact =
    categoryField.raw.length > 0 &&
    (categoryField.raw === rawQuery || (alnumQuery.length > 0 && categoryField.alnum === alnumQuery));

  if (brandExact || categoryExact) {
    return { wish, tier: 4, subScore: brandExact ? 380 : 350 };
  }

  const brandOrCatContains =
    hasPhraseMatch(brandField, rawQuery, alnumQuery) ||
    hasPhraseMatch(categoryField, rawQuery, alnumQuery);
  const titleBrandCatTokensMatch =
    queryTokens.length > 0 &&
    queryTokens.every(
      (t) =>
        hasDirectTokenMatch(titleField, t) ||
        hasDirectTokenMatch(brandField, t) ||
        hasDirectTokenMatch(categoryField, t)
    );

  if (brandOrCatContains || titleBrandCatTokensMatch) {
    const brandHits = queryTokens.filter((t) => hasDirectTokenMatch(brandField, t)).length;
    const catHits = queryTokens.filter((t) => hasDirectTokenMatch(categoryField, t)).length;
    let prefixBonus = 0;
    if (
      brandField.raw.startsWith(rawQuery) ||
      (alnumQuery && brandField.alnum.startsWith(alnumQuery))
    ) {
      prefixBonus += 40;
    }
    if (
      categoryField.raw.startsWith(rawQuery) ||
      (alnumQuery && categoryField.alnum.startsWith(alnumQuery))
    ) {
      prefixBonus += 25;
    }
    return { wish, tier: 4, subScore: 300 + prefixBonus + brandHits * 20 + catHits * 15 };
  }

  // 5. Description and related keyword matches
  const keywordsContains = hasPhraseMatch(keywordsField, rawQuery, alnumQuery);
  const descriptionContains = hasPhraseMatch(descriptionField, rawQuery, alnumQuery);

  const allFields = [titleField, brandField, categoryField, descriptionField, keywordsField];
  const allTokensDirectMatch =
    queryTokens.length > 0 &&
    queryTokens.every((t) => allFields.some((f) => hasDirectTokenMatch(f, t)));

  if (keywordsContains || descriptionContains || allTokensDirectMatch) {
    let subScore = 200;
    if (keywordsContains) subScore += 60;
    if (descriptionContains) subScore += 40;
    const titleTokenHits = queryTokens.filter((t) => hasDirectTokenMatch(titleField, t)).length;
    subScore += titleTokenHits * 20;
    return { wish, tier: 5, subScore };
  }

  // 6. Fuzzy matches (only when no exact/partial match succeeded)
  if (queryTokens.length > 0) {
    let totalSim = 0;
    let totalFieldPriority = 0;
    let fuzzyCount = 0;

    for (const token of queryTokens) {
      const hasDirect = allFields.some((f) => hasDirectTokenMatch(f, token));
      if (hasDirect) {
        totalSim += 1;
        totalFieldPriority += 50;
        continue;
      }

      const fuzzy = getBestFuzzyMatchForToken(token, allFields);
      if (fuzzy.similarity === 0) {
        return null;
      }
      fuzzyCount += 1;
      totalSim += fuzzy.similarity;
      totalFieldPriority += fuzzy.fieldPriority;
    }

    if (fuzzyCount > 0) {
      const avgSim = totalSim / queryTokens.length;
      const avgPriority = totalFieldPriority / queryTokens.length;
      return {
        wish,
        tier: 6,
        subScore: Math.round(avgSim * 100 + avgPriority),
      };
    }
  }

  return null;
}

/**
 * Filter and rank wishes by relevance (or optionally preserve custom sort order).
 */
export function searchAndRankWishes(
  wishes: Wish[],
  searchQuery: string,
  options?: {
    category?: string;
    sortBy?: 'newest' | 'budget_high' | 'budget_low';
  }
): Wish[] {
  const category = options?.category ?? 'All';
  const sortBy = options?.sortBy ?? 'newest';
  const rawQuery = normalizeSearchText(searchQuery);

  const categoryFiltered = wishes.filter(
    (wish) => category === 'All' || wish.category === category
  );

  if (!rawQuery) {
    if (sortBy === 'budget_high') {
      return [...categoryFiltered].sort((a, b) => b.budget - a.budget);
    }
    if (sortBy === 'budget_low') {
      return [...categoryFiltered].sort((a, b) => a.budget - b.budget);
    }
    return categoryFiltered;
  }

  const matches: Array<WishSearchMatch & { originalIndex: number }> = [];
  categoryFiltered.forEach((wish, idx) => {
    const match = evaluateWishSearchMatch(wish, rawQuery);
    if (match) {
      matches.push({ ...match, originalIndex: idx });
    }
  });

  matches.sort((a, b) => {
    if (sortBy === 'budget_high' && b.wish.budget !== a.wish.budget) {
      return b.wish.budget - a.wish.budget;
    }
    if (sortBy === 'budget_low' && a.wish.budget !== b.wish.budget) {
      return a.wish.budget - b.wish.budget;
    }
    if (a.tier !== b.tier) {
      return a.tier - b.tier;
    }
    if (a.subScore !== b.subScore) {
      return b.subScore - a.subScore;
    }
    return a.originalIndex - b.originalIndex;
  });

  return matches.map((m) => m.wish);
}

/**
 * Search and rank active Seller Offers consistently using the same normalized & fuzzy rules.
 */
export function searchAndRankOffers(
  offers: Offer[],
  searchQuery: string,
  category = 'All'
): Offer[] {
  const rawQuery = normalizeSearchText(searchQuery);
  const categoryFiltered = offers.filter(
    (off) => category === 'All' || off.category === category
  );
  if (!rawQuery) return categoryFiltered;

  const alnumQuery = normalizeAlphanumeric(searchQuery);
  const queryTokens = tokenizeSearchText(searchQuery);

  const matches: Array<OfferSearchMatch & { originalIndex: number }> = [];

  categoryFiltered.forEach((offer, idx) => {
    const titleField = buildFieldIndex(offer.wishTitle || '');
    const catField = buildFieldIndex(offer.category || '');
    const detailsField = buildFieldIndex(offer.details || '');
    const sellerField = buildFieldIndex(offer.sellerName || '');
    const allFields = [titleField, catField, detailsField, sellerField];

    let tier: SearchMatchTier | null = null;
    let subScore = 0;

    if (titleField.raw === rawQuery || (alnumQuery && titleField.alnum === alnumQuery)) {
      tier = 1;
      subScore = 1000;
    } else if (hasPhraseMatch(titleField, rawQuery, alnumQuery)) {
      tier = 2;
      subScore = 500;
    } else if (queryTokens.length > 0 && queryTokens.every((t) => hasDirectTokenMatch(titleField, t))) {
      tier = 3;
      subScore = 400;
    } else if (hasPhraseMatch(catField, rawQuery, alnumQuery)) {
      tier = 4;
      subScore = 300;
    } else if (
      hasPhraseMatch(detailsField, rawQuery, alnumQuery) ||
      (queryTokens.length > 0 &&
        queryTokens.every((t) => allFields.some((f) => hasDirectTokenMatch(f, t))))
    ) {
      tier = 5;
      subScore = 200;
    } else if (queryTokens.length > 0) {
      let totalSim = 0;
      let fuzzyCount = 0;
      let valid = true;
      for (const token of queryTokens) {
        if (allFields.some((f) => hasDirectTokenMatch(f, token))) {
          totalSim += 1;
        } else {
          const fuzzy = getBestFuzzyMatchForToken(token, allFields);
          if (fuzzy.similarity === 0) {
            valid = false;
            break;
          }
          fuzzyCount += 1;
          totalSim += fuzzy.similarity;
        }
      }
      if (valid && fuzzyCount > 0) {
        tier = 6;
        subScore = Math.round((totalSim / queryTokens.length) * 100);
      }
    }

    if (tier !== null) {
      matches.push({ offer, tier, subScore, originalIndex: idx });
    }
  });

  matches.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.subScore !== b.subScore) return b.subScore - a.subScore;
    return a.originalIndex - b.originalIndex;
  });

  return matches.map((m) => m.offer);
}

export interface WishSearchSuggestion {
  id: string;
  text: string;
  query: string;
  category: string;
  brand?: string;
}

/**
 * Generate deduplicated, relevance-ranked autocomplete suggestions
 * from actual WishMarket listings using the core wish search engine.
 */
export function getWishSearchSuggestions(
  wishes: Wish[],
  searchInput: string,
  options?: {
    category?: string;
    limit?: number;
  }
): WishSearchSuggestion[] {
  const rawQuery = normalizeSearchText(searchInput);
  if (!rawQuery) return [];

  const limit = options?.limit ?? 5;
  const rankedWishes = searchAndRankWishes(wishes, rawQuery, {
    category: options?.category ?? 'All',
    sortBy: 'newest',
  });

  const seenTitles = new Set<string>();
  const suggestions: WishSearchSuggestion[] = [];

  for (const wish of rankedWishes) {
    const normalizedTitle = normalizeSearchText(wish.title);
    if (!normalizedTitle || seenTitles.has(normalizedTitle)) {
      continue;
    }
    seenTitles.add(normalizedTitle);
    suggestions.push({
      id: wish.id,
      text: wish.title,
      query: wish.title,
      category: wish.category,
      brand: wish.brand,
    });
    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
}

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split suggestion text into highlighted vs plain segments for safe React rendering.
 */
export function splitHighlightSegments(text: string, query: string): HighlightSegment[] {
  const trimmed = query.trim();
  if (!trimmed || !text) {
    return [{ text, highlighted: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();

  // Single-character query: highlight the first word-start match (or first occurrence) cleanly
  if (trimmed.length === 1) {
    const escaped = escapeRegExp(trimmed);
    const wordStartRegex = new RegExp(`(^|[^a-z0-9\\u0E00-\\u0E7F])(${escaped})`, 'i');
    const wordMatch = wordStartRegex.exec(text);
    const matchIndex = wordMatch
      ? wordMatch.index + wordMatch[1].length
      : lowerText.indexOf(lowerQuery);

    if (matchIndex >= 0) {
      const segments: HighlightSegment[] = [];
      if (matchIndex > 0) {
        segments.push({ text: text.slice(0, matchIndex), highlighted: false });
      }
      segments.push({ text: text.slice(matchIndex, matchIndex + 1), highlighted: true });
      if (matchIndex + 1 < text.length) {
        segments.push({ text: text.slice(matchIndex + 1), highlighted: false });
      }
      return segments;
    }
    return [{ text, highlighted: false }];
  }

  // Exact contiguous phrase match
  if (lowerText.includes(lowerQuery)) {
    const phraseRegex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
    return text
      .split(phraseRegex)
      .filter((part) => part.length > 0)
      .map((part) => ({
        text: part,
        highlighted: part.toLowerCase() === lowerQuery,
      }));
  }

  // Multi-word partial token highlighting
  const tokens = Array.from(new Set(tokenizeSearchText(trimmed))).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) {
    return [{ text, highlighted: false }];
  }

  const tokenRegex = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const tokenSet = new Set(tokens.map((t) => t.toLowerCase()));
  return text
    .split(tokenRegex)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlighted: tokenSet.has(part.toLowerCase()),
    }));
}

