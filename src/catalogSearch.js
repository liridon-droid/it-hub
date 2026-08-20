/**
 * Relevance ranking for the service catalog — client-side copy.
 *
 * ⚠️ MIRROR of ticket-module's server/services/catalogSearch.js. The portal
 * loads the whole catalog once and filters it in the browser, so it has to
 * score locally; ticket-module scores the same rows server-side. Both must
 * agree on the order or the same query returns a different "best match"
 * depending on which surface you typed it into. If you change a weight or a
 * rule here, change it there in the same PR.
 *
 * Replaces what the portal did before: a substring test over
 * name+description+category with no ordering at all, which meant "excel"
 * found nothing (the alias lives in `tags`), "adobe photoshop" found nothing
 * (no contiguous phrase), and "mail" put Airmail above Gmail.
 */

// ── Weights ────────────────────────────────────────────────────────────────
// Ordered by how strong a signal each is about intent. The gaps are wide on
// purpose: one exact-name hit should outrank any number of description hits,
// because "I typed the app's name" is not a close call.
const W = {
  NAME_EXACT: 1000,
  NAME_PREFIX: 700,
  TAG_EXACT: 620,        // an admin deliberately wrote this alias down
  NAME_WORD_PREFIX: 550, // "cloud" → "Adobe Creative Cloud"
  ACRONYM: 480,          // "gcp" → "Google Cloud Platform"
  TAG_PREFIX: 430,
  NAME_CONTAINS: 350,
  TAG_CONTAINS: 240,
  CATEGORY: 150,
  DESC_WORD_PREFIX: 130,
  DESC_CONTAINS: 90,
  // Typo hits are deliberately worth less than their clean equivalents: a
  // real substring match should always win over a guess about what you meant.
  FUZZY_NAME: 300,
  FUZZY_TAG: 200,
};

// A token shorter than this is never fuzzy-matched — at 3 chars almost
// everything is within edit distance 1 of everything else ("vpn" → "van",
// "cpu"), which produces confident nonsense.
const FUZZY_MIN_LEN = 4;

/** Lowercase, strip punctuation to spaces, collapse whitespace. */
function normalise(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function tokenise(s) {
  const n = normalise(s);
  return n ? n.split(' ') : [];
}

/**
 * `tags` is JSONB in Postgres (already parsed) but legacy rows and some
 * import paths left a JSON *string* behind, and CatalogAdmin has historically
 * written at least one corrupted shape ('["[]"]'). Be liberal.
 */
function toTags(raw) {
  let v = raw;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    if (s.startsWith('[')) { try { v = JSON.parse(s); } catch { return [s]; } }
    else return s.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (!Array.isArray(v)) return [];
  return v
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t && t !== '[]' && t !== '[""]');
}

/**
 * Damerau-Levenshtein, abandoned as soon as it exceeds `max`.
 *
 * The early exit is what makes it safe to call across a whole catalog on
 * every keystroke: for the overwhelming majority of pairs (which are nothing
 * like each other) it bails on the first row instead of filling an m×n table.
 */
function editDistanceWithin(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (!a.length) return b.length <= max ? b.length : max + 1;
  if (!b.length) return a.length <= max ? a.length : max + 1;

  let prev2 = null;
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1);
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      // Transposition — "recieve"/"receive", the single most common typo.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prev2[j - 2] + 1);
      }
      cur[j] = d;
      if (d < rowMin) rowMin = d;
    }
    if (rowMin > max) return max + 1; // nothing in this row can recover
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** How wrong we're willing to let a token be, by its length. */
function fuzzyBudget(token) {
  if (token.length < FUZZY_MIN_LEN) return 0;
  if (token.length <= 6) return 1;
  return 2;
}

/**
 * First letters of each word — "Google Cloud Platform" → "gcp".
 * Only meaningful for multi-word names, and only worth checking for short
 * queries (nobody types a 9-letter acronym).
 */
function acronymOf(words) {
  return words.length >= 2 ? words.map((w) => w[0]).join('') : '';
}

/**
 * Precompute the per-item strings the scorer reads, so a scan over N items
 * doesn't re-normalise the same rows on every keystroke.
 *
 * Pass the result as `item.__idx`; `scoreItem` builds it on demand if absent.
 */
function indexItem(item) {
  const name = normalise(item.name);
  const nameWords = name ? name.split(' ') : [];
  const tags = toTags(item.tags).map(normalise).filter(Boolean);
  return {
    name,
    nameWords,
    acronym: acronymOf(nameWords),
    tags,
    category: normalise(item.category_name),
    // Long descriptions are truncated: past a couple of hundred characters a
    // substring hit says almost nothing about relevance, and scanning the
    // whole body on every keystroke is the one part of this that could get
    // expensive.
    desc: normalise(String(item.description || '').slice(0, 400)),
    descWords: null, // built lazily — most items never need it
  };
}

function descWordsOf(idx) {
  if (idx.descWords === null) idx.descWords = idx.desc ? idx.desc.split(' ') : [];
  return idx.descWords;
}

/** Best score any single token achieves against one item. */
function scoreToken(idx, token) {
  let best = 0;
  const hit = (v) => { if (v > best) best = v; };

  if (idx.name) {
    if (idx.name === token) hit(W.NAME_EXACT);
    else if (idx.name.startsWith(token)) hit(W.NAME_PREFIX);
    else if (idx.name.includes(token)) hit(W.NAME_CONTAINS);
    for (const w of idx.nameWords) {
      if (w === token) { hit(W.NAME_PREFIX); break; }
      if (w.startsWith(token)) hit(W.NAME_WORD_PREFIX);
    }
  }

  if (idx.acronym && idx.acronym === token) hit(W.ACRONYM);

  for (const t of idx.tags) {
    if (t === token) { hit(W.TAG_EXACT); break; }
    if (t.startsWith(token)) hit(W.TAG_PREFIX);
    else if (t.includes(token)) hit(W.TAG_CONTAINS);
  }

  if (idx.category && (idx.category === token || idx.category.includes(token))) hit(W.CATEGORY);

  if (idx.desc && idx.desc.includes(token)) {
    hit(W.DESC_CONTAINS);
    for (const w of descWordsOf(idx)) {
      if (w.startsWith(token)) { hit(W.DESC_WORD_PREFIX); break; }
    }
  }

  // Only reach for fuzzy when nothing matched cleanly — a token that already
  // hit a real substring doesn't need us guessing at what else it could be.
  if (best === 0) {
    const budget = fuzzyBudget(token);
    if (budget > 0) {
      let bestDist = budget + 1;
      for (const w of idx.nameWords) {
        const d = editDistanceWithin(token, w, budget);
        if (d < bestDist) bestDist = d;
        if (bestDist === 1) break;
      }
      if (bestDist <= budget) {
        // Scale by how wrong it was: distance 1 keeps most of the weight.
        hit(Math.round(W.FUZZY_NAME / bestDist));
      } else {
        for (const t of idx.tags) {
          const d = editDistanceWithin(token, t, budget);
          if (d <= budget) { hit(Math.round(W.FUZZY_TAG / d)); break; }
        }
      }
    }
  }

  return best;
}

/**
 * Score one item against a query.
 *
 * @returns {number} 0 when the item is not a match at all.
 */
function scoreItem(item, query, opts = {}) {
  const tokens = opts.tokens || tokenise(query);
  if (!tokens.length) return 0;

  const idx = item.__idx || (item.__idx = indexItem(item));
  const full = opts.full != null ? opts.full : normalise(query);

  // Whole-query pass first. "google workspace" typed in full should beat an
  // item that happens to contain both words scattered in its description.
  let score = 0;
  if (full && tokens.length > 1) {
    if (idx.name === full) score += W.NAME_EXACT;
    else if (idx.name.startsWith(full)) score += W.NAME_PREFIX;
    else if (idx.name.includes(full)) score += W.NAME_CONTAINS;
    if (idx.tags.includes(full)) score += W.TAG_EXACT;
  }

  // Every token must contribute something. A query is a conjunction: if you
  // typed two words, an item matching only one of them is usually the wrong
  // answer, and letting it through is how "adobe photoshop" ends up
  // returning every Adobe product AND every item mentioning photoshop.
  let matched = 0;
  for (const tok of tokens) {
    const s = scoreToken(idx, tok);
    if (s > 0) { matched++; score += s; }
  }
  if (matched === 0) return 0;

  // One unmatched token out of several is tolerated but heavily penalised —
  // people do type a stray word ("adobe photoshop licence"), and dropping to
  // zero results is worse than a demoted-but-present answer.
  if (matched < tokens.length) {
    const coverage = matched / tokens.length;
    if (coverage < 0.5) return 0;
    score = Math.round(score * coverage * 0.5);
  }

  // Popularity as a nudge, not a lever: enough to separate two items that
  // scored identically, never enough to move one past a better text match.
  const pop = Number(item.request_count) || 0;
  if (pop > 0) score += Math.min(40, Math.log10(pop + 1) * 20);

  // Shorter names win ties. "Slack" should beat "Slack Connect Guest Access"
  // for the query "slack".
  if (idx.name) score += Math.max(0, 12 - idx.name.length / 8);

  return score;
}

/**
 * Rank `items` against `query`, dropping non-matches.
 *
 * @param {Array} items      already-authorised candidate rows
 * @param {string} query
 * @param {{limit?: number, minScore?: number}} [opts]
 * @returns {Array} matching items, best first, each with `_score`
 */
function rankItems(items, query, opts = {}) {
  const tokens = tokenise(query);
  if (!tokens.length) return [];
  const full = normalise(query);
  const minScore = opts.minScore || 0;

  const out = [];
  for (const item of items) {
    const score = scoreItem(item, query, { tokens, full });
    if (score > minScore) out.push({ item, score });
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ap = Number(a.item.request_count) || 0;
    const bp = Number(b.item.request_count) || 0;
    if (bp !== ap) return bp - ap;
    return String(a.item.name || '').localeCompare(String(b.item.name || ''));
  });

  const limited = opts.limit ? out.slice(0, opts.limit) : out;
  return limited.map(({ item, score }) => {
    // Don't leak the memo onto the response body.
    const { __idx, ...rest } = item;
    return { ...rest, _score: Math.round(score) };
  });
}

/**
 * Confidence bands for "did you mean this app?" flows.
 *
 * The absolute numbers only mean anything relative to the weights above:
 *   strong  — an exact name/tag hit, or a clean prefix. Safe to preselect.
 *   likely  — a solid partial. Show it first, but ask.
 *   weak    — a fuzzy or description-only hit. Offer as one of several.
 */
function confidenceOf(score, runnerUpScore = 0) {
  if (score >= W.NAME_EXACT) return 'strong';
  if (score >= W.TAG_EXACT) return runnerUpScore && score - runnerUpScore < 120 ? 'likely' : 'strong';
  if (score >= W.NAME_CONTAINS) return 'likely';
  return 'weak';
}

export {
  rankItems,
  scoreItem,
  indexItem,
  tokenise,
  normalise,
  toTags,
  editDistanceWithin,
  confidenceOf,
  W as WEIGHTS,
};
