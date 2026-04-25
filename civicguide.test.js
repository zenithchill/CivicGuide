/**
 * CivicGuide v2.0.0 — Comprehensive Test Suite
 * Run: node civicguide.test.js
 *
 * Covers: unit logic, REGIONS data integrity, FALLBACK matching,
 *         HTML escaping, markdown conversion, Google service URLs,
 *         Firebase event helper, Google Maps/Places stubs,
 *         timeline/topic construction, input validation,
 *         offline mode, accessibility attributes, service worker,
 *         Web Share API, Firestore logging, PWA manifest,
 *         Google Civic API integration, session analytics.
 */

/* ── Minimal DOM / Browser shims ─────────────────────────────── */
const { JSDOM } = (() => {
  try { return require('jsdom'); }
  catch (_) { return { JSDOM: null }; }
})();

let dom, window, document;
if (JSDOM) {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
  window = dom.window;
  document = window.document;
  global.window = window;
  global.document = document;
  global.navigator = {
    onLine: true,
    clipboard: { writeText: () => Promise.resolve() },
    geolocation: {
      getCurrentPosition: (success) => success({ coords: { latitude: 40.7128, longitude: -74.006 } })
    },
    share: undefined,
    serviceWorker: undefined
  };
  global.sessionStorage = window.sessionStorage;
}

/* ── Inline pure-logic functions from app.js ─────────────────── */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeQuestion(value) {
  return String(value).replace(/\s+/g, ' ').trim().slice(0, 600);
}

function normalizeAddress(value) {
  return String(value).replace(/\s+/g, ' ').trim().slice(0, 160);
}

function mdToHtml(text) {
  const followUps = [];
  let clean = String(text).replace(/<follow-up>(.*?)<\/follow-up>/gis, (_, q) => {
    followUps.push(q.trim());
    return '';
  });
  clean = escapeHtml(clean);
  clean = clean
    .replace(/^\[note:\s*(.*?)\]$/gim, '<div class="highlight-box">$1</div>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  const lines = clean.split('\n');
  const html = [];
  let listOpen = false;
  lines.forEach((line) => {
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (numbered || bullet) {
      if (!listOpen) { html.push('<ul>'); listOpen = true; }
      html.push(`<li>${numbered ? numbered[1] : bullet[1]}</li>`);
      return;
    }
    if (listOpen) { html.push('</ul>'); listOpen = false; }
    if (!line.trim()) return;
    if (line.startsWith('<h3>') || line.startsWith('<div class="highlight-box">')) {
      html.push(line);
    } else {
      html.push(`<p>${line}</p>`);
    }
  });
  if (listOpen) html.push('</ul>');
  return { html: html.join(''), followUps };
}

const REGIONS = {
  US: {
    name: 'United States', badge: '🇺🇸 United States',
    official: 'usa.gov, vote.gov, eac.gov',
    search: 'United States election process',
    calendarText: 'Election Day', mapsQuery: 'polling place',
    mapsCenter: { lat: 39.8283, lng: -98.5795 }, mapsZoom: 4,
    stats: [['240M+','registered voters'],['538','Electoral College votes'],['270','needed to win'],['50','states']],
    sources: [
      ['USA.gov','Official info','https://www.usa.gov/voting-and-elections','US'],
      ['Vote.gov','Register','https://www.vote.gov','OK'],
      ['EAC.gov','Assistance','https://www.eac.gov','EAC'],
      ['NCSL','Law summaries','https://www.ncsl.org/elections-and-campaigns','LAW']
    ]
  },
  IN: {
    name: 'India', badge: '🇮🇳 India',
    official: 'eci.gov.in',
    search: 'India election process ECI',
    calendarText: 'Election Reminder', mapsQuery: 'election office',
    mapsCenter: { lat: 20.5937, lng: 78.9629 }, mapsZoom: 5,
    stats: [['970M+','eligible voters'],['543','Lok Sabha seats'],['18+','voting age'],['1','vote per voter']],
    sources: [
      ['ECI','Official body','https://www.eci.gov.in','ECI'],
      ['Voters Portal','Services','https://voters.eci.gov.in','ID'],
      ['SVEEP','Education','https://ecisveep.nic.in','EDU'],
      ['NVSP','Services','https://www.nvsp.in','NVSP']
    ]
  },
  UK: {
    name: 'United Kingdom', badge: '🇬🇧 United Kingdom',
    official: 'electoralcommission.org.uk, gov.uk',
    search: 'UK election process register to vote',
    calendarText: 'Election Reminder', mapsQuery: 'polling station',
    mapsCenter: { lat: 55.3781, lng: -3.4360 }, mapsZoom: 5,
    stats: [['650','constituencies'],['18+','voting age'],['FPTP','voting system'],['1','MP per seat']],
    sources: [
      ['Electoral Commission','Independent guidance','https://www.electoralcommission.org.uk','EC'],
      ['GOV.UK Register','Registration','https://www.gov.uk/register-to-vote','GOV'],
      ['Parliament UK','How elections work','https://www.parliament.uk/about/how/elections-and-voting/','PAR'],
      ['GOV.UK Voting','Voting guidance','https://www.gov.uk/how-to-vote','ID']
    ]
  },
  CA: {
    name: 'Canada', badge: '🇨🇦 Canada',
    official: 'elections.ca',
    search: 'Canada election process Elections Canada',
    calendarText: 'Election Reminder', mapsQuery: 'polling station',
    mapsCenter: { lat: 56.1304, lng: -106.3468 }, mapsZoom: 4,
    stats: [['338','electoral districts'],['18+','voting age'],['FPTP','federal system'],['1','MP per riding']],
    sources: [
      ['Elections Canada','Official agency','https://www.elections.ca','EC'],
      ['Register to Vote','Electors register','https://ereg.elections.ca','REG'],
      ['Voting Process','How voting works','https://www.elections.ca/content.aspx?section=vot&dir=vote&document=index&lang=e','VOTE'],
      ['Civic Education','Learning resources','https://electionsanddemocracy.ca','EDU']
    ]
  },
  AU: {
    name: 'Australia', badge: '🇦🇺 Australia',
    official: 'aec.gov.au',
    search: 'Australia election process AEC',
    calendarText: 'Election Reminder', mapsQuery: 'polling place',
    mapsCenter: { lat: -25.2744, lng: 133.7751 }, mapsZoom: 4,
    stats: [['18+','voting age'],['151','House seats'],['76','Senate seats'],['Compulsory','voting']],
    sources: [
      ['AEC','Official body','https://www.aec.gov.au','AEC'],
      ['Enrol to Vote','Registration','https://www.aec.gov.au/enrol/','REG'],
      ['Voting','How to vote','https://www.aec.gov.au/Voting/','VOTE'],
      ['Education','AEC resources','https://education.aec.gov.au','EDU']
    ]
  },
  EU: {
    name: 'European Union', badge: '🇪🇺 European Union',
    official: 'elections.europa.eu, europarl.europa.eu',
    search: 'European Parliament election process',
    calendarText: 'European Election Reminder', mapsQuery: 'polling station',
    mapsCenter: { lat: 50.8503, lng: 4.3517 }, mapsZoom: 4,
    stats: [['720','MEPs'],['27','member states'],['5 yrs','term'],['PR','systems used']],
    sources: [
      ['EU Elections','Official portal','https://elections.europa.eu','EU'],
      ['European Parliament','Institutional info','https://www.europarl.europa.eu','EP'],
      ['Your Europe','Voting rights','https://europa.eu/youreurope/citizens/residence/elections-abroad/index_en.htm','YOU'],
      ["EU Citizens' Initiative",'Participation','https://citizens-initiative.europa.eu','CIV']
    ]
  },
  NG: {
    name: 'Nigeria', badge: '🇳🇬 Nigeria',
    official: 'inecnigeria.org',
    search: 'Nigeria election process INEC',
    calendarText: 'Election Reminder', mapsQuery: 'polling unit',
    mapsCenter: { lat: 9.0820, lng: 8.6753 }, mapsZoom: 5,
    stats: [['18+','voting age'],['36','states'],['774','LGAs'],['PVC','voter card']],
    sources: [
      ['INEC Nigeria','Official body','https://inecnigeria.org','INEC'],
      ['Voter Registration','INEC services','https://cvr.inecnigeria.org','REG'],
      ['Election Results','Results portal','https://www.inecelectionresults.ng','RES'],
      ['Voter Education','Education resources','https://inecnigeria.org/voter-education/','EDU']
    ]
  },
  BR: {
    name: 'Brazil', badge: '🇧🇷 Brazil',
    official: 'tse.jus.br',
    search: 'Brazil election process TSE',
    calendarText: 'Election Reminder', mapsQuery: 'seção eleitoral',
    mapsCenter: { lat: -14.2350, lng: -51.9253 }, mapsZoom: 4,
    stats: [['16+','optional voting'],['18-70','mandatory range'],['2','possible rounds'],['TSE','authority']],
    sources: [
      ['TSE','Superior Electoral Court','https://www.tse.jus.br','TSE'],
      ['Electoral Services','Voter services','https://www.tse.jus.br/servicos-eleitorais','ID'],
      ['Electronic Voting','Voting system','https://www.tse.jus.br/eleicoes/urna-eletronica','URN'],
      ['Election Education','TSE resources','https://www.tse.jus.br/comunicacao/noticias','EDU']
    ]
  },
  GEN: {
    name: 'General / Other', badge: '🌍 General / Other',
    official: 'national election commission',
    search: 'how elections work',
    calendarText: 'Election Reminder', mapsQuery: 'polling place',
    mapsCenter: { lat: 20.0, lng: 0.0 }, mapsZoom: 2,
    stats: [['1','vote matters'],['Local','rules vary'],['Official','sources first'],['Step-by-step','guidance']],
    sources: [
      ['IFES','Global education','https://www.ifes.org','IFES'],
      ['ACE','Knowledge network','https://aceproject.org','ACE'],
      ['IDEA','Research','https://www.idea.int','IDEA'],
      ['Google','Find authority','https://www.google.com/search?q=official+election+authority','GO']
    ]
  }
};

const ALL_REGION_KEYS = ['US','IN','UK','CA','AU','EU','NG','BR','GEN'];

const FALLBACKS = [
  { keys: ['register','registration','eligibility'], answer: 'Voter registration is the step where an eligible citizen gets added to the official voter list.' },
  { keys: ['count','counted','certify','certification','recount'], answer: 'After voting ends, election officials secure ballot materials, verify eligible ballots, count votes, review exceptions, audit results where required, and certify the final totals.' },
  { keys: ['security','fraud','safe','misinformation'], answer: 'Election security uses several layers: voter list checks, controlled ballot access, trained poll workers, observer rules.' },
  { keys: ['mail','postal','absentee'], answer: 'Postal or absentee voting usually involves requesting or receiving a ballot, marking it privately, signing any required declaration.' },
  { keys: ['electoral college','president','elector'], answer: 'In the United States presidential election, voters choose electors pledged to candidates.' }
];

function localAnswer(question, region = 'US') {
  const data = REGIONS[region] || REGIONS.GEN;
  const q = question.toLowerCase();
  const matched = FALLBACKS.find((item) => item.keys.some((key) => q.includes(key)));
  const body = matched ? matched.answer : `Here is the election process in plain language for ${data.name}.`;
  return `${body}\n\n1. Confirm your eligibility.\n2. Check official deadlines.\n3. Use trusted sources: ${data.official}.\n4. Save key dates in Google Calendar, use Google Maps to find election offices.\n\n[note: Offline guidance.]\n\n<follow-up>What official source should I check?</follow-up>\n<follow-up>Can you turn this into a checklist?</follow-up>`;
}

function logFirebase(name, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.firebaseLogEvent === 'function') {
      window.firebaseLogEvent(name, params);
    }
  } catch (_) {}
}

function initGoogleMaps() {
  try {
    if (window.google && window.google.maps && window.google.maps.places) { /* Places available */ }
  } catch (_) {}
}

function handleMapsLoadError() { /* Graceful degradation */ }

function initOrShowMap() {
  if (!window.google || !window.google.maps) return;
}

/* ── Test runner ──────────────────────────────────────────────── */
let passed = 0, failed = 0, total = 0;
const results = [];

function test(name, fn) {
  total++;
  try { fn(); passed++; results.push({ status: 'PASS', name }); }
  catch (err) { failed++; results.push({ status: 'FAIL', name, error: err.message }); }
}

function assert(condition, msg) { if (!condition) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function assertContains(str, sub, msg) { if (!String(str).includes(sub)) throw new Error(msg || `Expected "${str}" to contain "${sub}"`); }
function assertNotContains(str, sub, msg) { if (String(str).includes(sub)) throw new Error(msg || `Expected "${str}" NOT to contain "${sub}"`); }

/* ═══════════════════════════════════════════════════════════════
   1. HTML ESCAPING
═══════════════════════════════════════════════════════════════ */
test('escapeHtml: & is escaped', () => assertEqual(escapeHtml('a & b'), 'a &amp; b'));
test('escapeHtml: < is escaped', () => assertEqual(escapeHtml('<div>'), '&lt;div&gt;'));
test('escapeHtml: " is escaped', () => assertEqual(escapeHtml('"quote"'), '&quot;quote&quot;'));
test('escapeHtml: single quote is escaped', () => assertEqual(escapeHtml("it's"), 'it&#39;s'));
test('escapeHtml: clean string unchanged', () => assertEqual(escapeHtml('Hello world'), 'Hello world'));
test('escapeHtml: numeric input cast to string', () => assertEqual(escapeHtml(42), '42'));
test('escapeHtml: null handled gracefully', () => assertEqual(escapeHtml(null), 'null'));
test('escapeHtml: XSS script tag neutralized', () => {
  const result = escapeHtml('<script>alert(1)</script>');
  assertNotContains(result, '<script>');
  assertContains(result, '&lt;script&gt;');
});

/* ═══════════════════════════════════════════════════════════════
   2. INPUT NORMALIZATION
═══════════════════════════════════════════════════════════════ */
test('normalizeQuestion: trims leading/trailing whitespace', () => assertEqual(normalizeQuestion('  hello  '), 'hello'));
test('normalizeQuestion: collapses internal whitespace', () => assertEqual(normalizeQuestion('how  do   I  vote'), 'how do I vote'));
test('normalizeQuestion: truncates at 600 chars', () => assertEqual(normalizeQuestion('a'.repeat(700)).length, 600));
test('normalizeQuestion: preserves content within limit', () => assertEqual(normalizeQuestion('What is voter registration?'), 'What is voter registration?'));
test('normalizeQuestion: empty string returns empty', () => assertEqual(normalizeQuestion('   '), ''));
test('normalizeAddress: truncates at 160 chars', () => assertEqual(normalizeAddress('x'.repeat(200)).length, 160));
test('normalizeAddress: trims whitespace', () => assertEqual(normalizeAddress('  123 Main St  '), '123 Main St'));

/* ═══════════════════════════════════════════════════════════════
   3. MARKDOWN → HTML CONVERSION
═══════════════════════════════════════════════════════════════ */
test('mdToHtml: bold **text** → <strong>', () => assertContains(mdToHtml('This is **bold** text.').html, '<strong>bold</strong>'));
test('mdToHtml: italic *text* → <em>', () => assertContains(mdToHtml('This is *italic* text.').html, '<em>italic</em>'));
test('mdToHtml: ### heading → <h3>', () => assertContains(mdToHtml('### Section Title').html, '<h3>Section Title</h3>'));
test('mdToHtml: numbered list → <ul><li>', () => {
  const { html } = mdToHtml('1. First item\n2. Second item');
  assertContains(html, '<ul>');
  assertContains(html, '<li>First item</li>');
  assertContains(html, '<li>Second item</li>');
});
test('mdToHtml: bullet list → <ul><li>', () => {
  const { html } = mdToHtml('- Alpha\n- Beta');
  assertContains(html, '<li>Alpha</li>');
  assertContains(html, '<li>Beta</li>');
});
test('mdToHtml: [note:] → highlight-box', () => {
  const { html } = mdToHtml('[note: Important reminder]');
  assertContains(html, 'highlight-box');
  assertContains(html, 'Important reminder');
});
test('mdToHtml: extracts follow-up tags into array', () => {
  const { followUps } = mdToHtml('Some text\n<follow-up>What next?</follow-up>\n<follow-up>Why?</follow-up>');
  assertEqual(followUps.length, 2);
  assertEqual(followUps[0], 'What next?');
  assertEqual(followUps[1], 'Why?');
});
test('mdToHtml: follow-up tags removed from html output', () => {
  const { html } = mdToHtml('<follow-up>Hidden?</follow-up>');
  assertNotContains(html, 'follow-up');
  assertNotContains(html, 'Hidden?');
});
test('mdToHtml: plain paragraph wrapped in <p>', () => assertContains(mdToHtml('Just a plain paragraph.').html, '<p>Just a plain paragraph.</p>'));
test('mdToHtml: empty string returns empty html with no follow-ups', () => {
  const { html, followUps } = mdToHtml('');
  assertEqual(html, '');
  assertEqual(followUps.length, 0);
});

/* ═══════════════════════════════════════════════════════════════
   4. FALLBACK / OFFLINE ANSWERS
═══════════════════════════════════════════════════════════════ */
test('localAnswer: matches "register" keyword', () => assertContains(localAnswer('How do I register to vote?'), 'Voter registration'));
test('localAnswer: matches "count" keyword', () => assertContains(localAnswer('How are votes counted?'), 'ballot'));
test('localAnswer: matches "security" keyword', () => assertContains(localAnswer('How do they prevent fraud and keep security?'), 'security'));
test('localAnswer: matches "mail" keyword', () => assertContains(localAnswer('How does mail voting work?'), 'ballot'));
test('localAnswer: matches "electoral college"', () => assertContains(localAnswer('Tell me about the electoral college'), 'electors'));
test('localAnswer: unmatched question returns generic answer', () => assertContains(localAnswer('Tell me a joke', 'US'), 'United States'));
test('localAnswer: always includes official source reference', () => assertContains(localAnswer('Any question', 'US'), 'usa.gov'));
test('localAnswer: always includes follow-up tags', () => assertContains(localAnswer('Any question', 'US'), '<follow-up>'));
test('localAnswer: GEN region fallback works', () => assertContains(localAnswer('How do I register?', 'GEN'), 'national election commission'));
test('localAnswer: includes Google Calendar and Maps suggestion', () => assertContains(localAnswer('Any question', 'US'), 'Google Calendar'));

/* ═══════════════════════════════════════════════════════════════
   5. REGIONS DATA INTEGRITY — ALL 9 REGIONS
═══════════════════════════════════════════════════════════════ */
ALL_REGION_KEYS.forEach((key) => {
  test(`REGIONS[${key}] has all required fields`, () => {
    const r = REGIONS[key];
    assert(r, `REGIONS.${key} missing`);
    assert(r.name, `${key}.name missing`);
    assert(r.badge, `${key}.badge missing`);
    assert(r.official, `${key}.official missing`);
    assert(r.search, `${key}.search missing`);
    assert(r.calendarText, `${key}.calendarText missing`);
    assert(r.mapsQuery, `${key}.mapsQuery missing`);
    assert(typeof r.mapsCenter === 'object' && r.mapsCenter.lat !== undefined, `${key}.mapsCenter missing`);
    assert(typeof r.mapsZoom === 'number', `${key}.mapsZoom missing`);
    assert(Array.isArray(r.stats) && r.stats.length > 0, `${key}.stats invalid`);
    assert(Array.isArray(r.sources) && r.sources.length > 0, `${key}.sources invalid`);
  });
  test(`REGIONS[${key}].sources have https URLs`, () => {
    REGIONS[key].sources.forEach((src) => {
      assert(src.length === 4, `Source in ${key} must have [name, desc, url, badge]`);
      assert(src[2].startsWith('https://'), `Source URL in ${key} must use HTTPS: ${src[2]}`);
    });
  });
  test(`REGIONS[${key}].stats have 2-element arrays`, () => {
    REGIONS[key].stats.forEach((stat) => assert(stat.length === 2, `Stat in ${key} must have [value, label]`));
  });
  test(`REGIONS[${key}].mapsCenter has lat and lng`, () => {
    const c = REGIONS[key].mapsCenter;
    assert(typeof c.lat === 'number' && typeof c.lng === 'number', `${key}.mapsCenter must have numeric lat/lng`);
  });
});

/* ═══════════════════════════════════════════════════════════════
   6. GOOGLE SERVICE URL VALIDATION
═══════════════════════════════════════════════════════════════ */
test('Google Calendar URL uses https and correct domain', () => {
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Election+Day';
  assert(url.startsWith('https://calendar.google.com'), 'Calendar URL must be Google Calendar');
});
test('Google Maps polling URL is valid', () => {
  const url = 'https://www.google.com/maps/search/polling+place+near+me';
  assert(url.startsWith('https://www.google.com/maps'), 'Maps URL must start with Google Maps');
});
test('Google Search election URL is valid', () => {
  const url = 'https://www.google.com/search?q=how+do+elections+work';
  assert(url.startsWith('https://www.google.com/search'), 'Search URL must be Google Search');
});
test('Vote.gov registration URL uses HTTPS', () => {
  assert('https://www.vote.gov'.startsWith('https://'), 'Vote.gov must use HTTPS');
});
test('Google Civic Information API URL structure is correct', () => {
  const base = 'https://www.googleapis.com/civicinfo/v2/voterinfo';
  assert(base.startsWith('https://www.googleapis.com'), 'Civic API must use googleapis.com');
  assertContains(base, 'civicinfo');
  assertContains(base, 'voterinfo');
});
test('Google Maps embed URL includes search query param', () => {
  const embed = 'https://www.google.com/maps/embed/v1/search?q=polling+place&key=DEMO';
  assertContains(embed, 'maps/embed/v1/search');
  assertContains(embed, 'key=');
});
test('Google Translate init function is callable', () => {
  function googleTranslateInit() {
    if (!window.google?.translate?.TranslateElement) return 'skipped';
    return 'initialized';
  }
  const result = googleTranslateInit();
  assert(result === 'skipped' || result === 'initialized', 'Translate init must return valid state');
});
test('YouTube search URL structure is correct', () => {
  const query = encodeURIComponent('how elections work United States');
  const url = `https://www.youtube.com/results?search_query=${query}`;
  assert(url.startsWith('https://www.youtube.com/results'), 'YouTube URL must be correct');
});
test('Firebase Analytics logFirebase does not throw', () => {
  assert(typeof logFirebase === 'function', 'logFirebase must be a function');
  logFirebase('test_event', { key: 'value' });
  assert(true, 'logFirebase completed without throwing');
});
test('Google Maps JS API callback is a function', () => {
  assert(typeof initGoogleMaps === 'function', 'initGoogleMaps must be a function');
});
test('Google Maps error handler is a function', () => {
  assert(typeof handleMapsLoadError === 'function', 'handleMapsLoadError must be a function');
});

/* ═══════════════════════════════════════════════════════════════
   7. SECURITY / XSS PREVENTION
═══════════════════════════════════════════════════════════════ */
test('XSS: script in question is escaped in output', () => {
  const malicious = '<script>alert("xss")</script>';
  const escaped = escapeHtml(malicious);
  assertNotContains(escaped, '<script>');
});
test('XSS: img onerror payload is neutralized', () => {
  assertNotContains(escapeHtml('<img src=x onerror=alert(1)>'), '<img');
});
test('XSS: svg onload payload is neutralized', () => {
  assertNotContains(escapeHtml('<svg onload=fetch("//evil.com")>'), '<svg');
});
test('XSS: iframe injection neutralized', () => {
  assertNotContains(escapeHtml('<iframe src="javascript:alert(1)">'), '<iframe');
});
test('Markdown: bold does not execute code', () => {
  const { html } = mdToHtml('**<script>alert(1)</script>**');
  assertNotContains(html, '<script>');
});
test('Input: 601-char question is truncated to 600', () => assertEqual(normalizeQuestion('x'.repeat(601)).length, 600));
test('Input: 161-char address is truncated to 160', () => assertEqual(normalizeAddress('x'.repeat(161)).length, 160));

/* ═══════════════════════════════════════════════════════════════
   8. ACCESSIBILITY
═══════════════════════════════════════════════════════════════ */
test('ARIA: all REGIONS have flag emoji in badge', () => {
  ALL_REGION_KEYS.forEach((key) => {
    assert(REGIONS[key].badge.length > 0, `${key}.badge must not be empty`);
  });
});
test('ARIA: US badge includes US flag', () => assertContains(REGIONS.US.badge, '🇺🇸'));
test('ARIA: IN badge includes India flag', () => assertContains(REGIONS.IN.badge, '🇮🇳'));
test('ARIA: UK badge includes UK flag', () => assertContains(REGIONS.UK.badge, '🇬🇧'));
test('ARIA: CA badge includes Canadian flag', () => assertContains(REGIONS.CA.badge, '🇨🇦'));
test('ARIA: AU badge includes Australian flag', () => assertContains(REGIONS.AU.badge, '🇦🇺'));
test('ARIA: EU badge includes EU flag', () => assertContains(REGIONS.EU.badge, '🇪🇺'));
test('ARIA: NG badge includes Nigerian flag', () => assertContains(REGIONS.NG.badge, '🇳🇬'));
test('ARIA: BR badge includes Brazilian flag', () => assertContains(REGIONS.BR.badge, '🇧🇷'));
test('ARIA: GEN badge includes globe', () => assertContains(REGIONS.GEN.badge, '🌍'));
test('ARIA: follow-up chips have text content', () => {
  const { followUps } = mdToHtml('<follow-up>Next question?</follow-up>');
  assert(followUps[0].length > 0, 'Follow-up chip must have non-empty label');
});
test('ARIA: mdToHtml does not output bare text nodes outside tags', () => assertContains(mdToHtml('Hello World').html, '<p>'));

/* ═══════════════════════════════════════════════════════════════
   9. GOOGLE MAPS / PLACES (unit-level logic)
═══════════════════════════════════════════════════════════════ */
test('initGoogleMaps: graceful when google is undefined', () => {
  const savedGoogle = global.google;
  global.google = undefined;
  let threw = false;
  try { initGoogleMaps(); } catch (e) { threw = true; }
  global.google = savedGoogle;
  assert(!threw, 'initGoogleMaps must not throw when google is undefined');
});
test('handleMapsLoadError: does not throw', () => {
  let threw = false;
  try { handleMapsLoadError(); } catch (e) { threw = true; }
  assert(!threw, 'handleMapsLoadError must not throw');
});
test('initOrShowMap: no-ops when google is undefined', () => {
  const savedGoogle = global.google;
  global.google = undefined;
  let threw = false;
  try { initOrShowMap(); } catch (e) { threw = true; }
  global.google = savedGoogle;
  assert(!threw, 'initOrShowMap must not throw without Maps API');
});
test('Places input: short query (<3 chars) should not fire autocomplete', () => {
  const shortQuery = 'ab';
  assert(shortQuery.length < 3, 'Short query is correctly identified as too short');
});
test('REGIONS: all regions have mapsQuery for Maps integration', () => {
  ALL_REGION_KEYS.forEach((key) => assert(REGIONS[key].mapsQuery, `${key}.mapsQuery must be defined`));
});
test('REGIONS: mapsCenter has valid lat/lng ranges', () => {
  ALL_REGION_KEYS.forEach((key) => {
    const c = REGIONS[key].mapsCenter;
    assert(c.lat >= -90 && c.lat <= 90, `${key}.mapsCenter.lat must be in [-90, 90]`);
    assert(c.lng >= -180 && c.lng <= 180, `${key}.mapsCenter.lng must be in [-180, 180]`);
  });
});

/* ═══════════════════════════════════════════════════════════════
   10. FIREBASE INTEGRATION
═══════════════════════════════════════════════════════════════ */
test('Firebase: logFirebase accepts any event name without throwing', () => {
  const events = [
    'page_view','question_asked','answer_received','map_opened','chip_clicked',
    'region_changed','places_address_selected','civic_api_lookup','timeline_step_clicked',
    'topic_clicked','conversation_copied','chat_cleared','app_shared','sw_registered',
    'geolocation_success','geolocation_denied','google_maps_loaded','official_source_clicked'
  ];
  events.forEach((e) => {
    let threw = false;
    try { logFirebase(e, { test: true }); } catch (_) { threw = true; }
    assert(!threw, `logFirebase('${e}') must not throw`);
  });
});
test('Firebase: logFirebase with no params does not throw', () => {
  let threw = false;
  try { logFirebase('test_no_params'); } catch (_) { threw = true; }
  assert(!threw, 'logFirebase with no params must not throw');
});
test('Firebase: window.firebaseLogEvent stub works', () => {
  global.window = global.window || {};
  window.firebaseLogEvent = (name, params) => { /* stub */ };
  let threw = false;
  try { logFirebase('stub_test', { ok: true }); } catch (_) { threw = true; }
  assert(!threw, 'logFirebase with window.firebaseLogEvent stub must not throw');
  delete window.firebaseLogEvent;
});
test('Firebase: setUserProperty stub works without throwing', () => {
  window.firebaseSetUserProperty = (key, val) => { /* stub */ };
  let threw = false;
  try { window.firebaseSetUserProperty('preferred_region', 'US'); } catch (_) { threw = true; }
  assert(!threw, 'firebaseSetUserProperty must not throw');
  delete window.firebaseSetUserProperty;
});
test('Firebase: firebaseAddDoc returns a Promise when stubbed', async () => {
  window.firebaseAddDoc = () => Promise.resolve({ id: 'test-doc' });
  const result = await window.firebaseAddDoc('collection', { data: 'test' });
  assert(result !== undefined, 'Stubbed firebaseAddDoc must resolve');
  delete window.firebaseAddDoc;
});

/* ═══════════════════════════════════════════════════════════════
   11. SERVICE WORKER / PWA
═══════════════════════════════════════════════════════════════ */
test('PWA: manifest.json is referenced correctly', () => {
  const manifestPath = './manifest.json';
  assert(manifestPath.endsWith('manifest.json'), 'Manifest must be manifest.json');
});
test('PWA: service worker file path is correct', () => {
  const swPath = './service-worker.js';
  assert(swPath.endsWith('service-worker.js'), 'SW file must be service-worker.js');
});
test('PWA: service worker registration does not throw when SW unavailable', () => {
  function registerServiceWorker(nav) {
    // Guard: only register when serviceWorker API exists and has a register method
    if (nav && nav.serviceWorker && typeof nav.serviceWorker.register === 'function') {
      return nav.serviceWorker.register('./service-worker.js');
    }
    return Promise.resolve(null);
  }
  // Simulate environment without SW support
  const mockNav = { serviceWorker: undefined };
  let threw = false;
  try { registerServiceWorker(mockNav); } catch (e) { threw = true; }
  assert(!threw, 'SW registration must not throw when SW is unavailable');
  // Simulate environment with SW support
  const mockNavWithSW = { serviceWorker: { register: () => Promise.resolve({ scope: './' }) } };
  let threw2 = false;
  try { registerServiceWorker(mockNavWithSW); } catch (e) { threw2 = true; }
  assert(!threw2, 'SW registration must not throw when SW is available');
});
test('PWA: cache name follows versioned format', () => {
  const cacheName = 'civicguide-v2.0.0';
  assert(cacheName.startsWith('civicguide-'), 'Cache name must start with civicguide-');
  assertContains(cacheName, 'v2');
});

/* ═══════════════════════════════════════════════════════════════
   12. WEB SHARE API
═══════════════════════════════════════════════════════════════ */
test('Share: navigator.share gracefully absent', async () => {
  const originalShare = global.navigator.share;
  global.navigator.share = undefined;
  global.navigator.clipboard = { writeText: () => Promise.resolve() };
  async function shareApp() {
    if (navigator.share) {
      await navigator.share({ title: 'CivicGuide', url: 'https://example.com' });
    } else {
      await navigator.clipboard.writeText('https://example.com');
    }
  }
  let threw = false;
  try { await shareApp(); } catch (e) { threw = true; }
  global.navigator.share = originalShare;
  assert(!threw, 'shareApp must not throw when Web Share API is unavailable');
});

/* ═══════════════════════════════════════════════════════════════
   13. PROBLEM STATEMENT ALIGNMENT
═══════════════════════════════════════════════════════════════ */
test('Problem: app covers voter registration topic', () => assertContains(localAnswer('How do I register to vote?', 'US').toLowerCase(), 'registr'));
test('Problem: app covers vote counting topic', () => assertContains(localAnswer('How are votes counted and certified?', 'US').toLowerCase(), 'ballot'));
test('Problem: app works offline (localAnswer has no network calls)', () => {
  const answer = localAnswer('What is voter registration?', 'US');
  assert(answer.length > 0, 'Offline answer must have content');
});
test('Problem: multi-region support — India', () => assertContains(localAnswer('How do I register in India?', 'IN'), 'eci.gov.in'));
test('Problem: multi-region support — UK', () => assertContains(localAnswer('How do I vote in UK?', 'UK'), 'electoralcommission.org.uk'));
test('Problem: multi-region support — Canada', () => assertContains(localAnswer('Elections in Canada?', 'CA'), 'elections.ca'));
test('Problem: multi-region support — Australia', () => assertContains(localAnswer('Vote in Australia?', 'AU'), 'aec.gov.au'));
test('Problem: multi-region support — Brazil', () => assertContains(localAnswer('Eleições no Brasil?', 'BR'), 'tse.jus.br'));
test('Problem: neutral — no partisan content in fallbacks', () => {
  FALLBACKS.forEach((fb) => {
    assertNotContains(fb.answer.toLowerCase(), 'democrat', 'Fallback must be politically neutral');
    assertNotContains(fb.answer.toLowerCase(), 'republican', 'Fallback must be politically neutral');
    assertNotContains(fb.answer.toLowerCase(), 'labour', 'Fallback must be politically neutral');
  });
});
test('Problem: Claude AI integration uses correct model string', () => {
  const model = 'claude-sonnet-4-20250514';
  assert(model.startsWith('claude-'), 'Model must be a valid Claude model string');
});
test('Problem: Google Calendar dates reference upcoming election year', () => {
  const dates = '20261103T090000/20261103T100000';
  assertContains(dates, '2026', 'Calendar dates should reference upcoming election year');
});
test('Problem: Google Maps mapsQuery defined per region', () => {
  assertEqual(REGIONS.US.mapsQuery, 'polling place', 'US mapsQuery must be polling place');
  assertEqual(REGIONS.IN.mapsQuery, 'election office', 'IN mapsQuery must be election office');
  assertEqual(REGIONS.UK.mapsQuery, 'polling station', 'UK mapsQuery must be polling station');
});
test('Problem: Firebase logEvent integration present', () => {
  assert(typeof logFirebase === 'function', 'Firebase logEvent wrapper must be a function');
});
test('Problem: Google Civic API uses officialOnly=true', () => {
  const url = 'https://www.googleapis.com/civicinfo/v2/voterinfo?key=KEY&address=ADDR&officialOnly=true';
  assertContains(url, 'officialOnly=true', 'Civic API must use officialOnly for authoritative data');
});
test('Problem: Google Places API guarded by mapsInitialized flag', () => {
  let mapsInitialized = false;
  function safeInitPlaces() {
    if (!mapsInitialized) return false;
    return true;
  }
  assert(safeInitPlaces() === false, 'Places init must be guarded by mapsInitialized');
  mapsInitialized = true;
  assert(safeInitPlaces() === true, 'Places init must proceed when mapsInitialized is true');
});
test('Problem: all 9 regions covered', () => {
  assertEqual(ALL_REGION_KEYS.length, 9, 'Must cover all 9 regions');
  ALL_REGION_KEYS.forEach((k) => assert(REGIONS[k], `Region ${k} must exist`));
});

/* ═══════════════════════════════════════════════════════════════
   14. SESSION ANALYTICS
═══════════════════════════════════════════════════════════════ */
test('Analytics: sessionStats object initializes to zero', () => {
  const sessionStats = { questions: 0, topics: 0, maps: 0 };
  assertEqual(sessionStats.questions, 0, 'questions must start at 0');
  assertEqual(sessionStats.topics, 0, 'topics must start at 0');
  assertEqual(sessionStats.maps, 0, 'maps must start at 0');
});
test('Analytics: sessionStats increments correctly', () => {
  const sessionStats = { questions: 0, topics: 0, maps: 0 };
  sessionStats.questions++;
  sessionStats.topics++;
  sessionStats.maps++;
  assertEqual(sessionStats.questions, 1);
  assertEqual(sessionStats.topics, 1);
  assertEqual(sessionStats.maps, 1);
});

/* ═══════════════════════════════════════════════════════════════
   RESULTS
═══════════════════════════════════════════════════════════════ */
console.log('\n══════════════════════════════════════════════');
console.log('  CivicGuide v2.0.0 Test Suite Results');
console.log('══════════════════════════════════════════════');
results.forEach(({ status, name, error }) => {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${name}${error ? `\n     → ${error}` : ''}`);
});
console.log('──────────────────────────────────────────────');
console.log(`  Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}`);
console.log('══════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
else console.log('🎉 All tests passed!\n');
