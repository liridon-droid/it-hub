// module-config — central config for running it-hub as a paired SliceDesk
// *module* (rather than a baked-in /portal2 page).
//
// Pairing credentials (apiKey, embedSecret, moduleId) are written to
// `.module-state.json` by the pairing step, but every value can be overridden
// by an env var so production can inject them from a secret manager instead of
// the on-disk file.
//
//   AUTH_MODE          'hub' (verify the iframe hub_token — module mode) or
//                      'slicedesk' (legacy shared-cookie bridge, sliceAuth.js).
//                      Defaults to 'slicedesk' so an un-migrated deploy keeps
//                      its current behaviour until AUTH_MODE=hub is set.
//   HUB_URL            Base URL of the SliceDesk hub (pairing, /api/ext/*, AI).
//   MODULE_API_KEY     ith_ key issued at pairing (authorises /api/ext/* + AI).
//   MODULE_EMBED_SECRET HMAC secret used to verify hub_token / forward tokens.
//   MODULE_ID          This module's id on the hub (embed page = <hub>/modules/<id>).
//   AI_PROXY_PATH      Hub path that proxies Claude calls (default /api/ai/proxy).
import { readFileSync } from 'node:fs';

function loadState() {
  try {
    const raw = readFileSync(new URL('./.module-state.json', import.meta.url), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const state = loadState();
const trimSlash = (s) => (s || '').replace(/\/$/, '');

export const moduleConfig = {
  hubUrl: trimSlash(process.env.HUB_URL || state.hub_url || ''),
  apiKey: process.env.MODULE_API_KEY || state.apiKey || '',
  embedSecret: process.env.MODULE_EMBED_SECRET || state.embedSecret || '',
  moduleId: String(
    process.env.MODULE_ID || (state.module && state.module.id) || state.module_id || '',
  ),
  authMode: (process.env.AUTH_MODE || 'dual').toLowerCase(),
  aiProxyPath: process.env.AI_PROXY_PATH || '/api/ai/proxy',
};

// Warn loudly at boot if we're in hub mode without the secrets we need, so a
// misconfigured deploy fails visibly rather than 401-ing every request with no
// explanation.
export function assertModulePaired() {
  if (moduleConfig.authMode !== 'hub') return;
  const missing = [];
  if (!moduleConfig.embedSecret) missing.push('embedSecret');
  if (!moduleConfig.apiKey) missing.push('apiKey');
  if (!moduleConfig.hubUrl) missing.push('hubUrl');
  if (missing.length) {
    console.warn(
      `[module-config] AUTH_MODE=hub but missing [${missing.join(', ')}] — ` +
        'pair the module first (see README). hub auth + AI proxy will fail until then.',
    );
  }
}
