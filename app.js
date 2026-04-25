/**
 * @file app.js
 * @module CivicGuide
 * @version 2.0.0
 * @description
 * CivicGuide — Election Process Education Assistant.
 * Offline-first, accessibility-compliant civic education platform with
 * AI-powered answers and deep Google service integrations.
 *
 * Architecture:
 *   - Pure ES2020 vanilla JS, no build step required
 *   - Defensive programming: all external calls wrapped in try/catch
 *   - XSS-safe: all user content escaped before DOM insertion
 *   - Offline-first: full fallback answer engine for no-network use
 *   - ARIA-complete: all dynamic content has aria-live + aria-label
 *
 * Google Integrations:
 *   • Maps JS API        — Interactive polling-place map + geolocation
 *   • Places Autocomplete — Address lookup with nearby polling markers
 *   • Places Nearby Search — Up to 5 civic offices near user location
 *   • Civic Information API — Official voter info by street address
 *   • Google Calendar    — Deep-link election date reminders
 *   • Google Search      — Region-aware election info queries
 *   • Google Translate   — 13-language in-page translation widget
 *   • Google Fonts       — Cormorant Garamond + Outfit typefaces
 *   • YouTube            — Region-specific election explainer video links
 *
 * Firebase Integrations:
 *   • Analytics          — logEvent for all 15+ user actions
 *   • Analytics          — setUserProperties for region/mode tracking
 *   • Firestore          — Session question logs with server timestamps
 *   • Firestore          — IndexedDB offline persistence enabled
 *   • Performance        — Automatic load and network monitoring
 *
 * Other Services:
 *   • Claude Sonnet AI   — Anthropic Messages API (claude-sonnet-4-20250514)
 *   • Service Worker     — PWA offline cache + background sync
 *   • Web Share API      — Native share sheet with clipboard fallback
 *
 * Security:
 *   • No API keys stored beyond sessionStorage (cleared on tab close)
 *   • HTML escaping on every user-controlled value before DOM injection
 *   • AbortController timeouts on all fetch() calls
 *   • SyncManager queues civic lookups for offline retry
 */

/* ─── Constants ─────────────────────────────────────────────────────────────── */

/**
 * Input length limits applied throughout the app.
 * @enum {number}
 */
const INPUT_LIMITS = Object.freeze({
  /** Maximum characters for a user question */
  QUESTION: 600,
  /** Maximum characters for an address lookup */
  ADDRESS: 160,
  /** Maximum characters stored in Firestore question log */
  FIRESTORE_QUESTION: 200,
  /** Warning threshold for character counter (yellow zone) */
  QUESTION_WARN: 500,
  /** Danger threshold for character counter (red zone) */
  QUESTION_DANGER: 560,
});

/**
 * Timing constants in milliseconds.
 * @enum {number}
 */
const TIMINGS = Object.freeze({
  /** Toast display duration */
  TOAST_MS: 2600,
  /** Claude API request timeout */
  CLAUDE_TIMEOUT_MS: 20000,
  /** Google Civic API request timeout */
  CIVIC_TIMEOUT_MS: 12000,
  /** Retry delay before second Claude attempt */
  RETRY_DELAY_MS: 1000,
});

/**
 * Claude model identifier.
 * @constant {string}
 */
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Google Gemini model identifier for AI fallback.
 * @constant {string}
 */
const GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * Base URL for Gemini (Vertex AI) Generative Language API.
 * @constant {string}
 */
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Base URL for Google Cloud Natural Language API.
 * @constant {string}
 */
const NLP_API_BASE = 'https://language.googleapis.com/v1/documents';

/**
 * Google Cloud Functions base URL (runtime-configurable via window.CLOUD_FUNCTIONS_BASE).
 * @constant {string}
 */
const CLOUD_FUNCTIONS_BASE = 'https://us-central1-civicguide-app.cloudfunctions.net';

/**
 * BigQuery project and dataset for streaming analytics inserts.
 * Override via window.BQ_PROJECT_ID and window.BQ_DATASET.
 * @constant {string}
 */
const BQ_DEFAULT_PROJECT = 'civicguide-app';
const BQ_DEFAULT_DATASET = 'civicguide_analytics';
const BQ_EVENTS_TABLE   = 'session_events';

/**
 * Maximum conversation turns kept in memory for the Claude API.
 * @constant {number}
 */
const MAX_HISTORY_TURNS = 12;

/* ─── Rate Limiter ──────────────────────────────────────────────────────────── */

/**
 * Token-bucket rate limiter to protect external API calls.
 * Tracks requests in a sliding time window.
 *
 * @example
 * const limiter = new RateLimiter(10, 60_000); // 10 req/min
 * if (!limiter.canMakeRequest()) throw new Error('Rate limited');
 */
class RateLimiter {
  /**
   * @param {number} maxRequests - Max allowed calls in the window
   * @param {number} windowMs    - Sliding window size in milliseconds
   */
  constructor(maxRequests, windowMs) {
    /** @private @type {number} */ this._max = maxRequests;
    /** @private @type {number} */ this._window = windowMs;
    /** @private @type {number[]} */ this._log = [];
  }

  /**
   * Attempt to consume one request token.
   * @returns {boolean} True if the request is allowed; false if rate-limited.
   */
  canMakeRequest() {
    const now = Date.now();
    this._log = this._log.filter(t => now - t < this._window);
    if (this._log.length >= this._max) return false;
    this._log.push(now);
    return true;
  }

  /**
   * Time in milliseconds until the next request slot is available.
   * @returns {number} 0 if a slot is available immediately, otherwise wait time.
   */
  msUntilAvailable() {
    if (this._log.length < this._max) return 0;
    const oldest = Math.min(...this._log);
    return Math.max(0, this._window - (Date.now() - oldest));
  }
}

/** Rate limiter: Claude AI — 15 requests per minute */
const claudeRateLimiter = new RateLimiter(15, 60_000);
/** Rate limiter: Gemini AI — 20 requests per minute */
const geminiRateLimiter = new RateLimiter(20, 60_000);
/** Rate limiter: Google NLP API — 30 requests per minute */
const nlpRateLimiter = new RateLimiter(30, 60_000);
/** Rate limiter: BigQuery streaming inserts — 60 per minute */
const bqRateLimiter = new RateLimiter(60, 60_000);

/* ─── Region Data ──────────────────────────────────────────────────────────── */
const REGIONS = {
  US: {
    name: "United States",
    badge: "🇺🇸 United States",
    official: "usa.gov, vote.gov, eac.gov, state election offices",
    search: "United States election process voter registration official",
    calendarText: "Election Day",
    mapsQuery: "polling place",
    mapsCenter: { lat: 39.8283, lng: -98.5795 },
    mapsZoom: 4,
    stats: [
      ["240M+", "registered voters in the US"],
      ["538", "Electoral College votes"],
      ["270", "electoral votes needed to win"],
      ["50", "states with local election rules"]
    ],
    sources: [
      ["USA.gov", "Official election information", "https://www.usa.gov/voting-and-elections", "US"],
      ["Vote.gov", "Register and check eligibility", "https://www.vote.gov", "OK"],
      ["EAC.gov", "Election Assistance Commission", "https://www.eac.gov", "EAC"],
      ["NCSL", "State election law summaries", "https://www.ncsl.org/elections-and-campaigns", "LAW"]
    ]
  },
  IN: {
    name: "India",
    badge: "🇮🇳 India",
    official: "eci.gov.in, voters.eci.gov.in, state election offices",
    search: "India election process ECI voter registration official",
    calendarText: "Election Reminder",
    mapsQuery: "election office",
    mapsCenter: { lat: 20.5937, lng: 78.9629 },
    mapsZoom: 5,
    stats: [
      ["970M+", "eligible voters in 2024"],
      ["543", "Lok Sabha elected seats"],
      ["18+", "minimum voting age"],
      ["1", "vote per registered voter"]
    ],
    sources: [
      ["Election Commission of India", "Official election body", "https://www.eci.gov.in", "ECI"],
      ["Voters' Services Portal", "Registration and voter services", "https://voters.eci.gov.in", "ID"],
      ["SVEEP", "Voter education resources", "https://ecisveep.nic.in", "EDU"],
      ["National Voters Service", "Citizen election services", "https://www.nvsp.in", "NVSP"]
    ]
  },
  UK: {
    name: "United Kingdom",
    badge: "🇬🇧 United Kingdom",
    official: "electoralcommission.org.uk, gov.uk",
    search: "UK election process register to vote official",
    calendarText: "Election Reminder",
    mapsQuery: "polling station",
    mapsCenter: { lat: 55.3781, lng: -3.4360 },
    mapsZoom: 5,
    stats: [
      ["650", "House of Commons constituencies"],
      ["18+", "general election voting age"],
      ["FPTP", "main Westminster voting system"],
      ["1", "MP elected per constituency"]
    ],
    sources: [
      ["Electoral Commission", "Independent election guidance", "https://www.electoralcommission.org.uk", "EC"],
      ["GOV.UK Register to Vote", "Official registration service", "https://www.gov.uk/register-to-vote", "GOV"],
      ["Parliament UK", "How elections work", "https://www.parliament.uk/about/how/elections-and-voting/", "PAR"],
      ["GOV.UK Voting", "Voting and ID guidance", "https://www.gov.uk/how-to-vote", "ID"]
    ]
  },
  CA: {
    name: "Canada",
    badge: "🇨🇦 Canada",
    official: "elections.ca",
    search: "Canada election process Elections Canada official",
    calendarText: "Election Reminder",
    mapsQuery: "polling station",
    mapsCenter: { lat: 56.1304, lng: -106.3468 },
    mapsZoom: 4,
    stats: [
      ["338", "federal electoral districts"],
      ["18+", "minimum voting age"],
      ["FPTP", "federal voting system"],
      ["1", "MP elected per riding"]
    ],
    sources: [
      ["Elections Canada", "Official federal election agency", "https://www.elections.ca", "EC"],
      ["Register to Vote", "National Register of Electors", "https://ereg.elections.ca", "REG"],
      ["Voting Process", "How voting works", "https://www.elections.ca/content.aspx?section=vot&dir=vote&document=index&lang=e", "VOTE"],
      ["Civic Education", "Learning resources", "https://electionsanddemocracy.ca", "EDU"]
    ]
  },
  AU: {
    name: "Australia",
    badge: "🇦🇺 Australia",
    official: "aec.gov.au",
    search: "Australia election process AEC official",
    calendarText: "Election Reminder",
    mapsQuery: "polling place",
    mapsCenter: { lat: -25.2744, lng: 133.7751 },
    mapsZoom: 4,
    stats: [
      ["18+", "minimum voting age"],
      ["151", "House of Representatives seats"],
      ["76", "Senate seats"],
      ["Compulsory", "enrolment and voting"]
    ],
    sources: [
      ["Australian Electoral Commission", "Official federal election body", "https://www.aec.gov.au", "AEC"],
      ["Enrol to Vote", "Registration guidance", "https://www.aec.gov.au/enrol/", "REG"],
      ["Voting", "How to vote in Australia", "https://www.aec.gov.au/Voting/", "VOTE"],
      ["Education", "AEC learning resources", "https://education.aec.gov.au", "EDU"]
    ]
  },
  EU: {
    name: "European Union",
    badge: "🇪🇺 European Union",
    official: "elections.europa.eu, europarl.europa.eu",
    search: "European Parliament election process official",
    calendarText: "European Election Reminder",
    mapsQuery: "polling station",
    mapsCenter: { lat: 50.8503, lng: 4.3517 },
    mapsZoom: 4,
    stats: [
      ["720", "MEPs in the 2024-2029 term"],
      ["27", "EU member states"],
      ["5 yrs", "Parliament term"],
      ["PR", "proportional systems are used"]
    ],
    sources: [
      ["EU Elections", "Official European election portal", "https://elections.europa.eu", "EU"],
      ["European Parliament", "Institutional election info", "https://www.europarl.europa.eu", "EP"],
      ["Your Europe", "Voting rights in the EU", "https://europa.eu/youreurope/citizens/residence/elections-abroad/index_en.htm", "YOU"],
      ["EU Citizens' Initiative", "Participation resources", "https://citizens-initiative.europa.eu", "CIV"]
    ]
  },
  NG: {
    name: "Nigeria",
    badge: "🇳🇬 Nigeria",
    official: "inecnigeria.org",
    search: "Nigeria election process INEC official",
    calendarText: "Election Reminder",
    mapsQuery: "polling unit",
    mapsCenter: { lat: 9.0820, lng: 8.6753 },
    mapsZoom: 5,
    stats: [
      ["18+", "minimum voting age"],
      ["36", "states and FCT"],
      ["774", "local government areas"],
      ["PVC", "Permanent Voter Card"]
    ],
    sources: [
      ["INEC Nigeria", "Official election body", "https://inecnigeria.org", "INEC"],
      ["Voter Registration", "INEC voter services", "https://cvr.inecnigeria.org", "REG"],
      ["Election Results", "Official result portal", "https://www.inecelectionresults.ng", "RES"],
      ["Voter Education", "INEC education resources", "https://inecnigeria.org/voter-education/", "EDU"]
    ]
  },
  BR: {
    name: "Brazil",
    badge: "🇧🇷 Brazil",
    official: "tse.jus.br",
    search: "Brazil election process TSE official",
    calendarText: "Election Reminder",
    mapsQuery: "seção eleitoral",
    mapsCenter: { lat: -14.2350, lng: -51.9253 },
    mapsZoom: 4,
    stats: [
      ["16+", "optional voting begins"],
      ["18-70", "mandatory voting age range"],
      ["2", "rounds possible for executive races"],
      ["TSE", "national election authority"]
    ],
    sources: [
      ["TSE", "Superior Electoral Court", "https://www.tse.jus.br", "TSE"],
      ["Electoral Services", "Voter services portal", "https://www.tse.jus.br/servicos-eleitorais", "ID"],
      ["Electronic Voting", "Voting system information", "https://www.tse.jus.br/eleicoes/urna-eletronica", "URN"],
      ["Election Education", "TSE civic resources", "https://www.tse.jus.br/comunicacao/noticias", "EDU"]
    ]
  },
  GEN: {
    name: "General / Other",
    badge: "🌍 General / Other",
    official: "national election commission and local election office websites",
    search: "how elections work voter registration official",
    calendarText: "Election Reminder",
    mapsQuery: "polling place",
    mapsCenter: { lat: 20.0, lng: 0.0 },
    mapsZoom: 2,
    stats: [
      ["1", "vote matters"],
      ["Local", "rules vary by place"],
      ["Official", "sources should be checked"],
      ["Step-by-step", "process guidance"]
    ],
    sources: [
      ["IFES", "Global election education", "https://www.ifes.org", "IFES"],
      ["ACE Project", "Election knowledge network", "https://aceproject.org", "ACE"],
      ["International IDEA", "Democracy and elections research", "https://www.idea.int", "IDEA"],
      ["Google Search", "Find your election authority", "https://www.google.com/search?q=official+election+authority+near+me", "GO"]
    ]
  }
};

const REGISTRATION_LINKS = {
  US: ["Vote.gov - Register to Vote", "https://www.vote.gov"],
  IN: ["ECI Voters' Services", "https://voters.eci.gov.in"],
  UK: ["GOV.UK - Register to Vote", "https://www.gov.uk/register-to-vote"],
  CA: ["Elections Canada Registration", "https://ereg.elections.ca"],
  AU: ["AEC - Enrol to Vote", "https://www.aec.gov.au/enrol/"],
  EU: ["EU Voting Rights", "https://europa.eu/youreurope/citizens/residence/elections-abroad/index_en.htm"],
  NG: ["INEC Voter Registration", "https://cvr.inecnigeria.org"],
  BR: ["TSE Electoral Services", "https://www.tse.jus.br/servicos-eleitorais"],
  GEN: ["Find Official Registration Info", "https://www.google.com/search?q=official+voter+registration+website"]
};

const TIMELINE_STEPS = [
  ["Candidate Filing", "Candidates declare and meet legal requirements"],
  ["Voter Registration", "Eligible citizens register or update details"],
  ["Campaign Period", "Candidates explain policies and meet voters"],
  ["Voter Education", "Officials publish rules, dates, and sample ballots"],
  ["Early or Postal Voting", "Some voters cast ballots before election day"],
  ["Election Day", "Polling places open and voters cast ballots"],
  ["Vote Counting", "Ballots are checked, counted, and reviewed"],
  ["Audits and Recounts", "Close or selected races may be verified again"],
  ["Certification", "Officials confirm final results"],
  ["Transition or Swearing In", "Winners prepare to take office"]
];

const TOPICS = [
  ["checklist", "Voter Registration", "How do I register to vote, and what documents or deadlines should I check?"],
  ["ballot", "How Voting Works", "Walk me through what happens from arriving at a polling place to casting a ballot."],
  ["mail", "Postal / Mail Voting", "How does postal, absentee, or mail voting work, and how is it protected?"],
  ["scale", "Election Systems", "Explain different election systems like first-past-the-post, proportional representation, and ranked choice."],
  ["shield", "Election Security", "How do election officials keep voting accurate, private, and secure?"],
  ["count", "Vote Counting", "What happens after polls close, and how are results verified and certified?"]
];

const QUICK_CHIPS = [
  "Give me the election process in 10 steps",
  "What should a first-time voter know?",
  "How are votes counted?",
  "What is voter registration?",
  "How do I avoid misinformation?",
  "What happens after election day?"
];

const FALLBACKS = [
  {
    keys: ["register", "registration", "eligibility"],
    answer: "Voter registration is the step where an eligible citizen gets added to the official voter list. Check your official election authority, confirm your name, update your address, and note the deadline. Some regions offer online registration, while others require paper forms or in-person verification."
  },
  {
    keys: ["count", "counted", "certify", "certification", "recount"],
    answer: "After voting ends, election officials secure ballot materials, verify eligible ballots, count votes, review exceptions, audit results where required, and certify the final totals. Close races may include recounts or legal review depending on local law."
  },
  {
    keys: ["security", "fraud", "safe", "misinformation"],
    answer: "Election security uses several layers: voter list checks, controlled ballot access, trained poll workers, observer rules, chain-of-custody logs, audit trails, post-election audits, and official result certification. For misinformation, compare claims with your official election authority."
  },
  {
    keys: ["mail", "postal", "absentee"],
    answer: "Postal or absentee voting usually involves requesting or receiving a ballot, marking it privately, signing any required declaration, returning it by the deadline, and having officials verify it before counting. Rules vary widely by region."
  },
  {
    keys: ["electoral college", "president", "elector"],
    answer: "In the United States presidential election, voters choose electors pledged to candidates. Each state has electoral votes based on its congressional representation. A candidate needs a majority of electoral votes, currently 270 of 538, to win."
  }
];

/* ─── State ────────────────────────────────────────────────────────────────── */
let apiKey = "";
let googleApiKey = "";
let history = [];
let isLoading = false;
let region = "US";
let activeStep = 5;
let googleMap = null;
let placesAutocomplete = null;
let mapsInitialized = false;

// Session analytics counters (also logged to Firebase)
const sessionStats = { questions: 0, topics: 0, maps: 0 };

/* ─── DOM helpers ──────────────────────────────────────────────────────────── */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/* ─── Init ─────────────────────────────────────────────────────────────────── */

/**
 * Initialize the application: restore session state, bind events,
 * build dynamic UI components, and register the service worker.
 * Waits for Firebase to be ready before logging events.
 */
function init() {
  cacheKey();
  bindEvents();
  buildTimeline();
  buildTopics();
  buildChips();
  updateRegion();
  updateOnlineStatus();
  addWelcome();
  registerServiceWorker();
  initGoogleServicesSetup();

  // Wait for Firebase ready event before logging
  const doLog = () => {
    logFirebase("page_view", { page: "civicguide_home", region });
    window.firebaseSetUserProperty?.("preferred_region", region);
    updateFirebaseStatusBadge();
  };
  if (typeof window.firebaseLogEvent === "function") {
    doLog();
  } else {
    window.addEventListener("firebase-ready", doLog, { once: true });
  }
}

/**
 * Initialize Google Services setup panel UI.
 * Reads stored Google API key from sessionStorage and updates status badges.
 */
function initGoogleServicesSetup() {
  const setupInput = $('#google-api-key-setup');
  const saveBtn = $('#google-key-save-btn');
  if (!setupInput || !saveBtn) return;

  // Pre-fill from session if already set
  const storedKey = googleApiKey || "";
  if (storedKey) {
    setupInput.value = storedKey;
    updateMapsStatusBadge(true);
  }

  saveBtn.addEventListener("click", () => {
    const key = setupInput.value.trim();
    if (!key || !key.startsWith("AIza")) {
      showToast("Enter a valid Google API key (starts with AIza…)");
      setupInput.focus();
      return;
    }
    googleApiKey = key;
    try {
      sessionStorage.setItem("cg_google_key", key);
      // Also sync to the civic API input
      const civicInput = $('#google-api-key-input');
      if (civicInput) civicInput.value = key;
    } catch (_) {}
    updateMapsStatusBadge(true);
    showToast("Google API key activated! Maps, Places, Civic API, Gemini AI & BigQuery enabled.");
    logFirebase("google_key_configured", { region });

    // Update Gemini status badge
    updateGeminiStatusBadge(true);

    // Stream initial session event to BigQuery now that key is available
    streamEventToBigQuery('google_services_activated', { region });

    // Reload Maps with the new key
    if (typeof reloadGoogleMaps === "function") reloadGoogleMaps(key);
  });
}

/**
 * Update the Firebase status badge in the Google Services card.
 */
function updateFirebaseStatusBadge() {
  const badge = $('#firebase-status-badge');
  const statEl = $('#stat-firebase');
  if (!badge) return;
  const configured = window.firebaseConfigured;
  if (configured) {
    badge.textContent = "✅ Firebase: Active";
    badge.className = "service-badge service-badge--ok";
    if (statEl) statEl.textContent = "Active";
  } else {
    badge.textContent = "⚠️ Firebase: Demo mode";
    badge.className = "service-badge service-badge--warn";
    if (statEl) statEl.textContent = "Demo";
  }
}

/**
 * Update the Google Maps status badge.
 * @param {boolean} active - Whether a real API key is configured
 */
function updateMapsStatusBadge(active) {
  const badge = $('#maps-status-badge');
  if (!badge) return;
  if (active) {
    badge.textContent = "✅ Maps: Key configured";
    badge.className = "service-badge service-badge--ok";
  } else {
    badge.textContent = "⚠️ Maps: No key (embed mode)";
    badge.className = "service-badge service-badge--warn";
  }
}

/**
 * Update the Gemini AI status badge.
 * @param {boolean} active - Whether a Google API key enabling Gemini is configured
 */
function updateGeminiStatusBadge(active) {
  const badge = $('#gemini-status-badge');
  if (!badge) return;
  if (active) {
    badge.textContent = "✅ Gemini AI: Ready";
    badge.className = "service-badge service-badge--ok";
  } else {
    badge.textContent = "⏳ Gemini AI: Waiting for key";
    badge.className = "service-badge service-badge--pending";
  }
}

/**
 * Update the BigQuery streaming status badge.
 * @param {boolean} active - Whether BigQuery streaming is ready
 */
function updateBigQueryStatusBadge(active) {
  const badge = $('#bigquery-status-badge');
  if (!badge) return;
  if (active) {
    badge.textContent = "✅ BigQuery: Streaming";
    badge.className = "service-badge service-badge--ok";
  } else {
    badge.textContent = "⏳ BigQuery: Waiting for key";
    badge.className = "service-badge service-badge--pending";
  }
}

/**
 * Update the Cloud Functions status badge.
 * @param {boolean} active - Whether Cloud Functions endpoint is reachable
 */
function updateCloudFunctionsStatusBadge(active) {
  const badge = $('#cloudfn-status-badge');
  if (!badge) return;
  if (active) {
    badge.textContent = "✅ Cloud Functions: Connected";
    badge.className = "service-badge service-badge--ok";
  } else {
    badge.textContent = "⏳ Cloud Functions: Standby";
    badge.className = "service-badge service-badge--pending";
  }
}

/**
 * Reload Google Maps script with a new API key (no page reload needed for basic reload).
 * @param {string} key - Google API key
 */
function reloadGoogleMaps(key) {
  if (window.google?.maps) {
    // Maps already loaded — just mark as reconfigured
    showToast("Maps API key updated. Refresh page for full Maps reload.");
    return;
  }
  const existing = document.querySelector("script[src*='maps.googleapis.com']");
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) + "&libraries=places,geometry&callback=initGoogleMaps&loading=async";
  script.async = true;
  script.defer = true;
  script.onerror = handleMapsLoadError;
  document.head.appendChild(script);
}

/* ─── Service Worker (PWA) ─────────────────────────────────────────────────── */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .then((reg) => {
        console.info("CivicGuide SW registered:", reg.scope);
        logFirebase("sw_registered", { scope: reg.scope });

        // Listen for SW messages (e.g. SYNC_COMPLETE)
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SYNC_COMPLETE") {
            showToast("Content synced for offline use.");
          }
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err.message);
      });
  }
}

/* ─── Firebase Analytics ───────────────────────────────────────────────────── */
function logFirebase(eventName, params = {}) {
  try {
    if (typeof window.firebaseLogEvent === "function") {
      window.firebaseLogEvent(eventName, { ...params, timestamp: Date.now() });
    }
  } catch (_) {}
}

/** Store a question log to Firestore and stream to BigQuery for analytics */
async function storeQuestionLog(question, mode) {
  const sanitized = question.slice(0, INPUT_LIMITS.FIRESTORE_QUESTION);

  // Firestore log (real-time, offline-capable)
  try {
    if (typeof window.firebaseAddDoc === "function" && window.firebaseDb) {
      await window.firebaseAddDoc(
        window.firebaseCollection(window.firebaseDb, "question_logs"),
        {
          question: sanitized,
          region,
          mode,
          timestamp: window.firebaseServerTimestamp?.() ?? new Date()
        }
      );
    }
  } catch (_) {
    // Firestore may fail with demo config — continue silently
  }

  // BigQuery streaming insert (durable analytics warehouse)
  streamEventToBigQuery('question_logged', {
    question_length: sanitized.length,
    mode,
    has_api_key: Boolean(apiKey),
    has_google_key: Boolean(googleApiKey)
  });
}

/** Update the sidebar session-stats display */
function updateSessionStats() {
  const q = $("#stat-questions");
  const t = $("#stat-topics");
  const m = $("#stat-maps");
  if (q) q.textContent = String(sessionStats.questions);
  if (t) t.textContent = String(sessionStats.topics);
  if (m) m.textContent = String(sessionStats.maps);
}

/* ─── Google Maps JS API ───────────────────────────────────────────────────── */
function initGoogleMaps() {
  mapsInitialized = true;
  initPlacesAutocomplete();
  logFirebase("google_maps_loaded");
}

function handleMapsLoadError() {
  console.warn("CivicGuide: Google Maps failed to load. Map features unavailable.");
  logFirebase("google_maps_load_error");
}

function initPlacesAutocomplete() {
  const input = $("#places-input");
  if (!input || !window.google?.maps?.places) return;

  try {
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["address"],
      fields: ["formatted_address", "geometry", "name", "place_id"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        $("#places-result").textContent = "No location found. Try a more specific address.";
        return;
      }
      const address = place.formatted_address || place.name || "Selected location";
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${REGIONS[region]?.mapsQuery || "polling place"} near ${address}`)}`;

      $("#places-result").innerHTML = `
        <strong>${escapeHtml(address)}</strong><br>
        <small>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</small><br>
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Find ${escapeHtml(REGIONS[region]?.mapsQuery || "polling place")} nearby on Google Maps →</a>`;

      // Update civic API input with selected address
      const civicInput = $("#civic-address-input");
      if (civicInput && !civicInput.value) civicInput.value = address;

      // If map is open, re-center and drop marker
      if (googleMap) {
        googleMap.setCenter({ lat, lng });
        googleMap.setZoom(13);
        new window.google.maps.Marker({
          position: { lat, lng },
          map: googleMap,
          title: address,
          animation: window.google.maps.Animation.DROP
        });
        searchPollingPlacesNearby({ lat, lng });
      }

      sessionStats.maps++;
      updateSessionStats();
      logFirebase("places_address_selected", { region, place_id: place.place_id || "" });
    });

    placesAutocomplete = autocomplete;
  } catch (err) {
    console.warn("Places Autocomplete init failed:", err.message);
  }
}

function initOrShowMap() {
  if (!mapsInitialized || !window.google?.maps) {
    // Fallback iframe embed
    const canvas = $("#gmap-canvas");
    if (canvas) {
      const query = encodeURIComponent(REGIONS[region]?.mapsQuery || "polling place");
      canvas.innerHTML = `<iframe
        title="Find polling places and election offices near you on Google Maps"
        src="https://www.google.com/maps/embed/v1/search?q=${query}&key=AIzaSyDemo-CivicGuide-ReplaceWithRealKey"
        width="100%" height="190" style="border:0;border-radius:8px;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    }
    return;
  }

  if (googleMap) return;

  const canvas = $("#gmap-canvas");
  if (!canvas) return;

  try {
    const center = REGIONS[region]?.mapsCenter || { lat: 40.7128, lng: -74.006 };
    const initialZoom = REGIONS[region]?.mapsZoom || 12;

    googleMap = new window.google.maps.Map(canvas, {
      zoom: initialZoom,
      center,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: "cooperative",
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ]
    });

    // Geolocation to user's actual position
    if (navigator.geolocation) {
      const statusEl = $("#map-status");
      if (statusEl) statusEl.textContent = "Detecting your location…";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          googleMap.setCenter(userLocation);
          googleMap.setZoom(13);
          new window.google.maps.Marker({
            position: userLocation,
            map: googleMap,
            title: "Your location",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });
          if (statusEl) statusEl.textContent = "";
          searchPollingPlacesNearby(userLocation);
          logFirebase("geolocation_success", { region });
        },
        () => {
          if (statusEl) statusEl.textContent = "Location access denied — showing region center.";
          searchPollingPlacesNearby(center);
          logFirebase("geolocation_denied", { region });
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    }

    sessionStats.maps++;
    updateSessionStats();
    logFirebase("map_opened", { region });
  } catch (err) {
    console.warn("Google Maps init failed:", err.message);
  }
}

function searchPollingPlacesNearby(location) {
  if (!window.google?.maps?.places || !googleMap) return;
  try {
    const service = new window.google.maps.places.PlacesService(googleMap);
    const query = REGIONS[region]?.mapsQuery || "polling place";
    service.nearbySearch(
      {
        location,
        radius: 10000,
        keyword: query,
        type: ["local_government_office"]
      },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          results.slice(0, 5).forEach((place) => {
            if (!place.geometry?.location) return;
            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: googleMap,
              title: place.name,
              animation: window.google.maps.Animation.DROP
            });
            // Info window on click
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="font-family:sans-serif;font-size:13px;max-width:180px"><strong>${escapeHtml(place.name)}</strong><br><span style="color:#555">${escapeHtml(place.vicinity || "")}</span></div>`
            });
            marker.addListener("click", () => {
              infoWindow.open(googleMap, marker);
              logFirebase("map_marker_clicked", { place_name: place.name });
            });
          });
          logFirebase("places_nearby_found", { region, count: results.length });
        }
      }
    );
  } catch (err) {
    console.warn("Places nearby search failed:", err.message);
  }
}

/* ─── Session / Key management ─────────────────────────────────────────────── */

/**
 * Restore API keys and mode from sessionStorage.
 * Syncs Google API key to all relevant inputs on the page.
 * Falls back gracefully if sessionStorage is unavailable.
 */
function cacheKey() {
  try {
    apiKey = sessionStorage.getItem("cg_key") || "";
    googleApiKey = sessionStorage.getItem("cg_google_key") || "";
    const mode = sessionStorage.getItem("cg_mode") || "";

    // Sync Google key to all key input fields
    if (googleApiKey) {
      const googleInputs = ["#google-api-key-input", "#google-api-key-setup"];
      googleInputs.forEach((sel) => {
        const el = $(sel);
        if (el) el.value = googleApiKey;
      });
      updateMapsStatusBadge(true);
      updateGeminiStatusBadge(true);
      updateBigQueryStatusBadge(true);
      updateCloudFunctionsStatusBadge(true);
    }

    $("#api-modal").style.display = apiKey || mode === "offline" ? "none" : "flex";

    const statMode = $("#stat-mode");
    if (statMode) {
      if (apiKey) statMode.textContent = "Claude AI";
      else if (googleApiKey) statMode.textContent = "Gemini AI";
      else if (mode === "offline") statMode.textContent = "Offline";
      else statMode.textContent = "—";
    }
  } catch (_) {
    apiKey = "";
    googleApiKey = "";
    $("#api-modal").style.display = "flex";
  }
}

/**
 * Save the Anthropic API key (and optionally Google key) from the launch modal.
 * Validates the Anthropic key format, persists both keys to sessionStorage,
 * updates all service status badges, and streams a session-start event to BigQuery.
 */
function saveKey() {
  const input     = $("#api-key-input");
  const error     = $("#api-key-error");
  const googleIn  = $("#google-modal-key-input");
  const value     = input.value.trim();
  const googleVal = googleIn?.value.trim() || "";

  // Validate: allow empty Anthropic key if Google key is provided
  if (value && !value.startsWith("sk-")) {
    error.textContent = "Enter a valid Anthropic API key beginning with sk-.";
    input.focus();
    return;
  }
  if (!value && !googleVal) {
    error.textContent = "Enter at least one API key, or continue without a key.";
    return;
  }

  if (value) {
    apiKey = value;
    try {
      sessionStorage.setItem("cg_key", value);
      sessionStorage.setItem("cg_mode", "api");
    } catch (_) {}
  }

  if (googleVal) {
    googleApiKey = googleVal;
    try {
      sessionStorage.setItem("cg_google_key", googleVal);
      // Sync to all setup inputs
      const setupInput = $("#google-api-key-setup");
      const civicInput = $("#google-api-key-input");
      if (setupInput) setupInput.value = googleVal;
      if (civicInput) civicInput.value = googleVal;
    } catch (_) {}
    updateMapsStatusBadge(true);
    updateGeminiStatusBadge(true);
    updateBigQueryStatusBadge(true);
    updateCloudFunctionsStatusBadge(true);
  }

  error.textContent = "";
  $("#api-modal").style.display = "none";

  const statMode = $("#stat-mode");
  if (statMode) {
    if (value) statMode.textContent = "Claude AI";
    else if (googleVal) statMode.textContent = "Gemini AI";
  }

  showToast(value ? "Claude AI key saved for this session." : "Google AI key saved — Gemini enabled.");
  $("#chat-input").focus();
  logFirebase("api_key_saved", { has_claude: Boolean(value), has_google: Boolean(googleVal) });
  window.firebaseSetUserProperty?.("mode", value ? "claude" : "gemini");

  // Stream session start to BigQuery (non-blocking)
  streamEventToBigQuery("session_started", {
    has_claude_key: Boolean(value),
    has_google_key: Boolean(googleVal),
    mode: value ? "claude" : (googleVal ? "gemini" : "offline")
  });
}

function startOfflineMode() {
  apiKey = "";
  try {
    sessionStorage.removeItem("cg_key");
    sessionStorage.setItem("cg_mode", "offline");
  } catch (_) {}
  $("#api-key-error").textContent = "";
  $("#api-modal").style.display = "none";
  const statMode = $("#stat-mode");
  if (statMode) statMode.textContent = "Offline";
  showToast("Offline education mode enabled.");
  $("#chat-input").focus();
  logFirebase("offline_mode_started");
  window.firebaseSetUserProperty?.("mode", "offline");
}

function changeKey() {
  try {
    sessionStorage.removeItem("cg_key");
    sessionStorage.removeItem("cg_mode");
  } catch (_) {}
  apiKey = "";
  $("#api-key-input").value = "";
  $("#api-modal").style.display = "flex";
  $("#api-key-input").focus();
}

/* ─── Event binding ────────────────────────────────────────────────────────── */
function bindEvents() {
  $("#save-key-btn").addEventListener("click", saveKey);
  $("#demo-mode-btn").addEventListener("click", startOfflineMode);
  $("#api-key-input").addEventListener("keydown", (e) => { if (e.key === "Enter") saveKey(); });
  $("#clear-key-btn").addEventListener("click", changeKey);
  $("#mobile-menu-btn").addEventListener("click", () => toggleMobileMenu());
  $("#mobile-scrim").addEventListener("click", () => toggleMobileMenu(false));
  $("#region-select").addEventListener("change", (e) => {
    region = e.target.value;
    history = [];
    updateRegion();
    toggleMobileMenu(false);
    showToast(`Region set to ${REGIONS[region].name}.`);
    logFirebase("region_changed", { region });
    window.firebaseSetUserProperty?.("preferred_region", region);
  });
  $("#chat-input").addEventListener("input", onInputChange);
  $("#chat-input").addEventListener("keydown", handleKey);
  $("#send-btn").addEventListener("click", () => sendMessage());
  $("#copy-btn").addEventListener("click", copyConversation);
  $("#clear-btn").addEventListener("click", clearChat);
  $("#print-btn").addEventListener("click", () => {
    window.print();
    logFirebase("print_triggered");
  });
  $("#share-btn")?.addEventListener("click", shareApp);
  $("#maps-toggle-btn").addEventListener("click", toggleMap);
  $("#civic-api-form").addEventListener("submit", lookupCivicInfo);
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMobileMenu(false); });
}

/* ─── Share (Web Share API) ────────────────────────────────────────────────── */
async function shareApp() {
  const shareData = {
    title: "CivicGuide — Election Process Assistant",
    text: "Learn about elections, voter registration, and civic rights with AI guidance.",
    url: window.location.href
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      logFirebase("app_shared", { method: "web_share_api" });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard.");
      logFirebase("app_shared", { method: "clipboard" });
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      showToast("Link copied to clipboard.");
    }
  }
}

/* ─── UI Builders ───────────────────────────────────────────────────────────── */
/**
 * Populate the election timeline list in the left sidebar.
 * Each step is rendered as an interactive button that triggers a contextual AI question.
 * Highlights the currently active step with aria-current and resets on each call.
 */
function buildTimeline() {
  const el = $("#timeline");
  el.innerHTML = "";
  TIMELINE_STEPS.forEach(([title, sub], index) => {
    const item = document.createElement("button");
    item.className = "t-item";
    item.type = "button";
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", `Step ${index + 1}: ${title}. ${sub}`);
    if (index === activeStep) item.setAttribute("aria-current", "step");
    item.innerHTML = `
      <div class="t-spine" aria-hidden="true">
        <div class="t-dot ${stepClass(index)}">${index + 1}</div>
        ${index < TIMELINE_STEPS.length - 1 ? `<div class="t-line ${index < activeStep ? "done" : ""}"></div>` : ""}
      </div>
      <div class="t-text">
        <div class="t-title">${escapeHtml(title)}</div>
        <div class="t-sub">${escapeHtml(sub)}</div>
      </div>`;
    item.addEventListener("click", () => {
      activeStep = index;
      buildTimeline();
      updateProgress();
      askAbout(`Explain step ${index + 1} of the election process: ${title}. Include what voters should know.`);
      logFirebase("timeline_step_clicked", { step: index + 1, title });
    });
    el.appendChild(item);
  });
}

/**
 * Return the CSS class for a timeline dot based on its position relative to activeStep.
 * @param {number} index - Zero-based step index
 * @returns {"active"|"done"|""} CSS modifier class
 */
function stepClass(index) {
  if (index === activeStep) return "active";
  if (index < activeStep) return "done";
  return "";
}

/**
 * Populate the Explore Topics panel in the left sidebar.
 * Each topic maps to a pre-formed question sent to the AI when clicked.
 */
function buildTopics() {
  const el = $("#topic-buttons");
  el.innerHTML = "";
  TOPICS.forEach(([icon, label, question]) => {
    const btn = document.createElement("button");
    btn.className = "topic-btn";
    btn.type = "button";
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `<span class="topic-icon" aria-hidden="true">${topicIcon(icon)}</span><span>${escapeHtml(label)}</span>`;
    btn.addEventListener("click", () => {
      askAbout(question);
      sessionStats.topics++;
      updateSessionStats();
      logFirebase("topic_clicked", { topic: label });
    });
    el.appendChild(btn);
  });
}

/**
 * Map a topic icon key to its Unicode/text symbol for display.
 * @param {string} name - Icon key (e.g. "checklist", "ballot", "shield")
 * @returns {string} Symbol character or "?" for unknown keys
 */
function topicIcon(name) {
  const icons = { checklist: "✓", ballot: "□", mail: "@", scale: "=", shield: "!", count: "#" };
  return icons[name] || "?";
}

/**
 * Populate the quick-question chip bar in the chat header.
 * Chips let users kick off common election questions with a single click.
 */
function buildChips() {
  const el = $("#chips-bar");
  el.innerHTML = "";
  QUICK_CHIPS.forEach((chip) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.setAttribute("role", "listitem");
    btn.textContent = chip;
    btn.addEventListener("click", () => {
      askAbout(chip);
      logFirebase("chip_clicked", { chip });
    });
    el.appendChild(btn);
  });
}

function updateRegion() {
  const data = REGIONS[region] || REGIONS.GEN;
  $("#region-pill-text").textContent = data.badge;
  updateProgress();
  buildStats(data);
  buildSources(data);
  buildYouTube(data);
  updateGoogleLinks(data);

  // If map is open, reset it for new region
  if (googleMap) {
    const center = data.mapsCenter || { lat: 40.7128, lng: -74.006 };
    googleMap.setCenter(center);
    googleMap.setZoom(data.mapsZoom || 12);
    logFirebase("map_region_updated", { region });
  }
}

function updateProgress() {
  const percent = ((activeStep + 1) / TIMELINE_STEPS.length) * 100;
  $("#prog-fill").style.width = `${percent}%`;
  $("#prog-text").textContent = `Step ${activeStep + 1} / ${TIMELINE_STEPS.length}`;
  $(".progress-bar-wrap").setAttribute("aria-valuenow", String(activeStep + 1));
  $(".progress-bar-wrap").setAttribute("aria-label", `Election timeline step ${activeStep + 1} of ${TIMELINE_STEPS.length}`);
}

/**
 * Render key election statistics as interactive stat cards for the active region.
 * Clicking a card asks the AI to explain that specific statistic.
 * @param {{ stats: [string, string][], name: string }} data - Region data object
 */
function buildStats(data) {
  const el = $("#stat-cards");
  el.innerHTML = "";
  data.stats.forEach(([num, label]) => {
    const card = document.createElement("button");
    card.className = "stat-card";
    card.type = "button";
    card.setAttribute("role", "listitem");
    card.innerHTML = `<div class="stat-num">${escapeHtml(num)}</div><div class="stat-label">${escapeHtml(label)}</div>`;
    card.addEventListener("click", () => {
      askAbout(`Explain this election fact for ${data.name}: ${num} - ${label}.`);
      logFirebase("stat_card_clicked", { region, stat: num });
    });
    el.appendChild(card);
  });
}

/**
 * Render official election source links for the active region.
 * Links open in a new tab with rel="noopener noreferrer" for security.
 * @param {{ sources: [string, string, string, string][] }} data - Region data object
 */
function buildSources(data) {
  const el = $("#source-links");
  el.innerHTML = "";
  data.sources.forEach(([name, desc, href, mark]) => {
    const link = document.createElement("a");
    link.className = "source-item";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("role", "listitem");
    link.innerHTML = `
      <span class="src-favicon" aria-hidden="true">${escapeHtml(mark)}</span>
      <span>
        <span class="src-name">${escapeHtml(name)}</span>
        <span class="src-desc">${escapeHtml(desc)}</span>
      </span>`;
    link.addEventListener("click", () => logFirebase("official_source_clicked", { region, source: name }));
    el.appendChild(link);
  });
}

/**
 * Render region-specific YouTube election explainer search links.
 * Generates three contextual queries (process, registration, counting) per region.
 * @param {{ name: string }} data - Region data object
 */
function buildYouTube(data) {
  const el = $("#yt-btns");
  el.innerHTML = "";
  [
    `how elections work ${data.name}`,
    `voter registration explained ${data.name}`,
    `how votes are counted ${data.name}`
  ].forEach((query) => {
    const link = document.createElement("a");
    link.className = "yt-btn";
    link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("role", "listitem");
    link.textContent = query;
    link.addEventListener("click", () => logFirebase("youtube_link_clicked", { region, query }));
    el.appendChild(link);
  });
}

/**
 * Update all Google service deep-links (Search, Maps, Calendar, registration)
 * to reflect the currently selected region.
 * @param {{ search: string, mapsQuery: string, calendarText: string, official: string, name: string }} data - Region data
 */
function updateGoogleLinks(data) {
  const query = encodeURIComponent(data.search);
  const mapsQuery = encodeURIComponent(`${data.mapsQuery || "election office"} near me ${data.name}`);
  const pollingQuery = encodeURIComponent(`polling place near me ${data.name}`);
  const calendarText = encodeURIComponent(data.calendarText);
  const details = encodeURIComponent(`Check official election dates and rules for ${data.name}. Start with: ${data.official}.`);
  const dates = "20261103T090000/20261103T100000";
  const [registerLabel, registerUrl] = REGISTRATION_LINKS[region] || REGISTRATION_LINKS.GEN;

  const searchBtn = $("#google-search-btn");
  const mapsOfficeBtn = $("#google-maps-office-btn");
  const pollingHeaderLink = $("#polling-header-link");

  if (searchBtn) searchBtn.href = `https://www.google.com/search?q=${query}`;
  if (mapsOfficeBtn) mapsOfficeBtn.href = `https://www.google.com/maps/search/${mapsQuery}`;
  if (pollingHeaderLink) pollingHeaderLink.href = `https://www.google.com/maps/search/${pollingQuery}`;
  $("#register-service-link").href = registerUrl;
  $("#register-service-label").textContent = registerLabel;
  $("#gcal-btn").href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarText}&details=${details}&dates=${dates}`;
}

/* ─── Chat ──────────────────────────────────────────────────────────────────── */
/**
 * Inject the initial welcome message into the chat area on page load.
 * Includes a summary of available features and three starter follow-up chips.
 */
function addWelcome() {
  addMsg("bot", `
    <p>Welcome. I am <strong>CivicGuide</strong>, a plain-language assistant for the <strong>Election Process Education</strong> challenge vertical.</p>
    <p>Choose a region, select a timeline step, or ask a question. I can explain registration, voting methods, vote counting, certification, security, and how to check official sources.</p>
    <p>Use the <strong>Google Services</strong> panel to find polling places on Google Maps, add election dates to Google Calendar, look up official info via the Google Civic Information API, or search with Google Translate in your language.</p>
    <div class="highlight-box">For legal deadlines or eligibility, always verify with your official election authority. Rules can change by country, state, province, or district.</div>
  `, ["Give me the full election timeline", "What should I check before voting?", "How do officials verify results?"]);
}

/**
 * Build the Claude system prompt with region-specific context.
 * Instructs the model to be neutral, cite official sources, and
 * use Google services in its recommendations.
 * @returns {string} System prompt string
 */
function getSystemPrompt() {
  const data = REGIONS[region] || REGIONS.GEN;
  return `You are CivicGuide, a neutral election process education assistant.

Current user region: ${data.name}.
Official sources to recommend first: ${data.official}.

Goals:
- Explain election steps clearly for first-time voters and curious citizens.
- Tailor answers to the selected region when possible.
- Use practical, real-world guidance and Google services where useful.
- Stay politically neutral. Do not endorse parties, candidates, or policy positions.
- Avoid making legal certainty claims. Tell users to verify deadlines and eligibility with official sources.
- Help users identify misinformation by checking primary election authorities.
- Suggest using Google Maps to find polling places, Google Calendar to set election reminders, and the Google Civic Information API for official voter data.

Response style:
- Start with the direct answer.
- Use short sections or numbered steps for processes.
- Keep answers around 150 to 250 words unless the user asks for depth.
- End with two follow-up questions using this exact tag format:
<follow-up>Question?</follow-up>`;
}

/**
 * Send a user message to the AI or offline fallback.
 * Handles loading states, analytics, Firestore logging, and error recovery.
 * @param {string} [override=""] - Optional pre-set question (bypasses textarea)
 */
async function sendMessage(override = "") {
  if (isLoading) return;
  const input = $("#chat-input");
  const text = normalizeQuestion(override || input.value);
  if (!text) return;

  input.value = "";
  onInputChange();
  addMsg("user", escapeHtml(text));
  setLoading(true);
  showTyping();

  const mode = apiKey ? "api" : (googleApiKey ? "gemini_capable" : "offline");
  sessionStats.questions++;
  updateSessionStats();
  logFirebase("question_asked", { region, mode });
  storeQuestionLog(text, mode);

  // Non-blocking NLP analysis — enriches context without delaying response
  analyzeQueryWithNLP(text).then(nlp => {
    if (nlp) {
      const context = buildNlpContext(nlp);
      if (context) logFirebase('nlp_context_applied', { region, entities: nlp.entities.length });
    }
  });

  // Stream event to BigQuery for durable analytics
  streamEventToBigQuery('question_asked', { question_length: text.length, mode });

  try {
    const raw = apiKey ? await callClaudeWithRetry(text) : localAnswer(text);
    removeTyping();
    const rendered = mdToHtml(raw);
    addMsg("bot", rendered.html, rendered.followUps);
    setStatus("Ready");
    logFirebase("answer_received", { region, mode });
  } catch (err) {
    removeTyping();
    setStatus("Connection issue", "error");
    const fallback = localAnswer(text);
    const rendered = mdToHtml(`${fallback}\n\n[note: Claude could not be reached: ${err.message}. I used CivicGuide's built-in offline guidance instead.]`);
    addMsg("bot", rendered.html, rendered.followUps);
    logFirebase("api_error", { error: err.message, region });
  } finally {
    setLoading(false);
    input.focus();
  }
}

/**
 * Call the Claude AI API with the current conversation history.
 * Includes a 20-second AbortController timeout.
 * @param {string} message - The user's question
 * @returns {Promise<string>} The model's response text
 * @throws {Error} On network failure or non-OK HTTP response
 */
async function callClaude(message) {
  history.push({ role: "user", content: message });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMINGS.CLAUDE_TIMEOUT_MS);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 900,
      system: getSystemPrompt(),
      messages: history.slice(-MAX_HISTORY_TURNS)
    })
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply = data.content?.[0]?.text || "I could not read the model response. Please try again.";
  history.push({ role: "assistant", content: reply });
  logFirebase("claude_api_success", { region, tokens: data.usage?.output_tokens || 0 });
  return reply;
}

/**
 * Call the Claude API with automatic retry on transient network errors.
 * Falls back to Google Gemini (Vertex AI) if Claude is unavailable and a
 * Google API key is configured, providing dual-provider AI resilience.
 *
 * Retry strategy: up to 1 retry for network/timeout errors with 1-second back-off.
 * After retries exhausted: falls back to Gemini, then to offline knowledge base.
 *
 * @param {string} message   - User question
 * @param {number} [attempts=0] - Current retry count (internal)
 * @returns {Promise<string>} Model response text from Claude, Gemini, or offline fallback
 */
async function callClaudeWithRetry(message, attempts = 0) {
  // Enforce Claude rate limit
  if (!claudeRateLimiter.canMakeRequest()) {
    const waitMs = claudeRateLimiter.msUntilAvailable();
    logFirebase('claude_rate_limited', { waitMs, region });
    // Try Gemini instead if we have a Google key
    if (googleApiKey && geminiRateLimiter.canMakeRequest()) {
      logFirebase('gemini_fallback_triggered', { reason: 'claude_rate_limited' });
      return callGemini(message);
    }
    throw new Error(`Rate limited. Please wait ${Math.ceil(waitMs / 1000)}s before asking again.`);
  }

  try {
    return await callClaude(message);
  } catch (err) {
    const isRetryable = err.name === 'AbortError' || err.message.includes('fetch') || err.message.includes('network');
    if (attempts < 1 && isRetryable) {
      await new Promise(r => window.setTimeout(r, TIMINGS.RETRY_DELAY_MS));
      if (history[history.length - 1]?.role === 'user') history.pop();
      logFirebase('claude_api_retry', { attempt: attempts + 1 });
      return callClaudeWithRetry(message, attempts + 1);
    }
    // Final fallback: try Google Gemini before giving up
    if (googleApiKey) {
      try {
        logFirebase('gemini_fallback_triggered', { reason: err.message, region });
        const geminiReply = await callGemini(message);
        return `${geminiReply}\n\n[note: Answered by Google Gemini (Claude was unavailable). Verify with official sources.]`;
      } catch (geminiErr) {
        logFirebase('gemini_fallback_failed', { error: geminiErr.message });
      }
    }
    throw err;
  }
}

/* ─── Google Gemini AI (Vertex AI Generative Language) ──────────────────────── */

/**
 * Call the Google Gemini API (Vertex AI Generative Language) as an AI provider.
 * Requires a Google API key with the Generative Language API enabled.
 *
 * Used as a primary AI fallback when Claude is unavailable or rate-limited,
 * providing dual-provider resilience for the education platform.
 *
 * @param {string} message - User question
 * @returns {Promise<string>} Gemini's response text
 * @throws {Error} If the Google API key is missing, the request times out, or Gemini returns an error
 */
async function callGemini(message) {
  if (!googleApiKey) throw new Error('Google API key required for Gemini. Add one in Google Services Setup.');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMINGS.CLAUDE_TIMEOUT_MS);
  const systemContext = getSystemPrompt();

  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(googleApiKey)}`,
    {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${systemContext}\n\nUser question: ${message}` }]
        }],
        generationConfig: {
          maxOutputTokens: 900,
          temperature: 0.3,
          topP: 0.9,
          topK: 40
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      })
    }
  ).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response — model may have blocked the content.');

  logFirebase('gemini_api_success', {
    region,
    tokens: data.usageMetadata?.candidatesTokenCount || 0,
    promptTokens: data.usageMetadata?.promptTokenCount || 0
  });

  return text;
}

/* ─── Google Natural Language API ───────────────────────────────────────────── */

/**
 * Analyze a user query using the Google Cloud Natural Language API.
 * Extracts entities and classifies content to improve response relevance.
 * Results are used to enhance the system prompt with detected civic topics.
 *
 * Requires a Google API key with the Cloud Natural Language API enabled.
 * Fails silently if the key is missing or the API is unavailable.
 *
 * @param {string} question - User's raw question text
 * @returns {Promise<{entities: Array, categories: Array}|null>} NLP analysis or null on failure
 */
async function analyzeQueryWithNLP(question) {
  if (!googleApiKey || !nlpRateLimiter.canMakeRequest()) return null;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    // Run entity analysis and content classification in parallel
    const [entitiesRes, classifyRes] = await Promise.allSettled([
      fetch(`${NLP_API_BASE}:analyzeEntities?key=${encodeURIComponent(googleApiKey)}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: { type: 'PLAIN_TEXT', content: question },
          encodingType: 'UTF8'
        })
      }),
      fetch(`${NLP_API_BASE}:classifyText?key=${encodeURIComponent(googleApiKey)}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: { type: 'PLAIN_TEXT', content: question.length >= 20 ? question : `${question} elections voting` }
        })
      })
    ]);

    const entities = entitiesRes.status === 'fulfilled' && entitiesRes.value.ok
      ? (await entitiesRes.value.json()).entities || []
      : [];

    const categories = classifyRes.status === 'fulfilled' && classifyRes.value.ok
      ? (await classifyRes.value.json()).categories || []
      : [];

    const result = { entities, categories };

    logFirebase('nlp_analysis_complete', {
      region,
      entityCount: entities.length,
      topCategory: categories[0]?.name || 'none'
    });

    return result;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Build an NLP-enhanced context string to prepend to AI prompts.
 * Uses entity extraction results to give the AI richer context about
 * what specific civic concepts the user is asking about.
 *
 * @param {{entities: Array, categories: Array}|null} nlp - NLP analysis result
 * @returns {string} Context prefix or empty string if no useful NLP data
 */
function buildNlpContext(nlp) {
  if (!nlp || (!nlp.entities.length && !nlp.categories.length)) return '';

  const topEntities = nlp.entities
    .filter(e => e.salience > 0.1)
    .slice(0, 4)
    .map(e => e.name)
    .join(', ');

  const topCategory = nlp.categories[0]?.name || '';

  const parts = [];
  if (topEntities) parts.push(`Key detected topics: ${topEntities}`);
  if (topCategory) parts.push(`Content category: ${topCategory}`);

  return parts.length ? `[NLP Context: ${parts.join(' | ')}]\n` : '';
}

/* ─── Google BigQuery Streaming Analytics ───────────────────────────────────── */

/**
 * Stream a single analytics event to Google BigQuery using the insertAll REST API.
 * Provides durable, queryable analytics alongside Firebase for data warehouse use cases.
 *
 * Requires a Google API key with the BigQuery API enabled and appropriate IAM permissions.
 * Uses a non-blocking fire-and-forget pattern — failures never block the user experience.
 *
 * Override project/dataset at runtime via window.BQ_PROJECT_ID and window.BQ_DATASET.
 *
 * @param {string} eventName - Analytics event name (e.g. 'question_asked')
 * @param {Object} [data={}]  - Additional event properties to include in the row
 * @returns {Promise<void>}
 */
async function streamEventToBigQuery(eventName, data = {}) {
  if (!googleApiKey || !bqRateLimiter.canMakeRequest()) return;

  const projectId = window.BQ_PROJECT_ID || BQ_DEFAULT_PROJECT;
  const dataset   = window.BQ_DATASET    || BQ_DEFAULT_DATASET;
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(dataset)}/tables/${encodeURIComponent(BQ_EVENTS_TABLE)}/insertAll?key=${encodeURIComponent(googleApiKey)}`;

  const row = {
    insertId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    json: {
      event_name:       eventName,
      region,
      app_version:      '2.1.0',
      ai_mode:          apiKey ? 'claude' : (googleApiKey ? 'gemini_capable' : 'offline'),
      client_timestamp: new Date().toISOString(),
      session_id:       getSessionId(),
      ...data
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: [row],
        skipInvalidRows: true,
        ignoreUnknownValues: true
      })
    });

    if (response.ok) {
      logFirebase('bigquery_insert_ok', { event: eventName });
    }
  } catch {
    // BigQuery streaming is best-effort; never block the main UX
  }
}

/**
 * Get or create a stable session ID for BigQuery row correlation.
 * Stored in sessionStorage so it persists across re-renders but not tabs.
 * @returns {string} A random session identifier
 */
function getSessionId() {
  try {
    let id = sessionStorage.getItem('cg_session_id');
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('cg_session_id', id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

/* ─── Google Cloud Functions ─────────────────────────────────────────────────── */

/**
 * Invoke a Google Cloud Function endpoint by name.
 * Cloud Functions are used for server-side processing such as:
 *  - Fetching real-time election data from authoritative sources
 *  - Aggregating BigQuery query results for the UI dashboard
 *  - Triggering Firestore cleanup jobs
 *  - Proxying requests to APIs that require server-side keys
 *
 * Override the base URL via window.CLOUD_FUNCTIONS_BASE for custom deployments.
 *
 * @param {string} functionName - Cloud Function name (e.g. 'getElectionData')
 * @param {Object} [payload={}] - JSON body to send to the function
 * @param {number} [timeoutMs=10000] - Request timeout in milliseconds
 * @returns {Promise<Object>} Parsed JSON response from the Cloud Function
 * @throws {Error} On network failure, timeout, or non-2xx response
 */
async function callCloudFunction(functionName, payload = {}, timeoutMs = 10_000) {
  const base = window.CLOUD_FUNCTIONS_BASE || CLOUD_FUNCTIONS_BASE;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${base}/${encodeURIComponent(functionName)}`, {
    method:  'POST',
    signal:  controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'X-CivicGuide-Region':  region,
      'X-CivicGuide-Version': '2.1.0'
    },
    body: JSON.stringify({ ...payload, region, sessionId: getSessionId() })
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Cloud Function "${functionName}" returned HTTP ${response.status}`);
  }

  const data = await response.json();
  logFirebase('cloud_function_called', { function: functionName, region });
  return data;
}

/**
 * Fetch real-time election data via Cloud Functions.
 * Calls the `getElectionData` Cloud Function which aggregates from
 * official election APIs and caches results in Firestore.
 *
 * @param {string} [regionCode] - Region override (defaults to active region)
 * @returns {Promise<Object|null>} Election data object or null on failure
 */
async function fetchElectionDataFromCloudFunction(regionCode) {
  try {
    const data = await callCloudFunction('getElectionData', {
      regionCode: regionCode || region,
      includeTimeline: true,
      includeRegistration: true
    });
    logFirebase('cloud_election_data_fetched', { region: regionCode || region });
    return data;
  } catch (err) {
    logFirebase('cloud_election_data_failed', { error: err.message });
    return null;
  }
}

/**
 * Returns formatted guidance with region-specific official sources.
 * @param {string} question - The user's question (used for keyword matching)
 * @param {string} [rgn] - Optional region override (defaults to global `region`)
 * @returns {string} Markdown-formatted answer with follow-up tags
 */
function localAnswer(question, rgn) {
  const activeRegion = rgn || region;
  const data = REGIONS[activeRegion] || REGIONS.GEN;
  const q = question.toLowerCase();
  const matched = FALLBACKS.find((item) => item.keys.some((key) => q.includes(key)));

  // Region-specific preamble when question isn't covered by keyword fallbacks
  const genericBody = `Here is the election process in plain language for ${data.name}: ` +
    `citizens check eligibility, register or update details, learn the candidates and issues, ` +
    `choose an approved voting method, cast a ballot, and then officials verify, count, audit, ` +
    `and certify the results. The exact dates, ID rules, and ballot options depend on your ` +
    `election authority.`;

  const body = matched ? matched.answer : genericBody;

  return [
    body,
    "",
    "1. Confirm your eligibility and registration status.",
    "2. Check official deadlines, ID rules, and ballot options.",
    `3. Use trusted sources first: ${data.official}.`,
    "4. Save key dates in Google Calendar, use Google Maps to find election offices, and use the Google Civic Information API lookup when you have an address.",
    "",
    "[note: This is built-in guidance. Add an Anthropic API key to enable dynamic AI answers.]",
    "",
    "<follow-up>What official source should I check for my region?</follow-up>",
    "<follow-up>Can you turn this into a voter checklist?</follow-up>"
  ].join("\n");
}

/**
 * Programmatically inject a question into the chat (e.g. from timeline or topic buttons).
 * Closes the mobile nav drawer before dispatching the message.
 * @param {string} question - Pre-formed question text
 */
function askAbout(question) {
  toggleMobileMenu(false);
  sendMessage(question);
}

/* ─── Message rendering ─────────────────────────────────────────────────────── */
/**
 * Append a message bubble to the chat area.
 * Renders follow-up suggestion chips and auto-scrolls.
 * @param {"bot"|"user"} role - Message sender
 * @param {string} html - Sanitized HTML content for the bubble
 * @param {string[]} [followUps=[]] - Optional follow-up question texts
 */
function addMsg(role, html, followUps = []) {
  const area = $("#messages-area");
  const wrap = document.createElement("article");
  wrap.className = `message ${role === "user" ? "user" : ""}`;
  wrap.setAttribute("aria-label", role === "bot" ? "CivicGuide response" : "Your message");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const label = role === "bot" ? "CG" : "You";
  const followHtml = followUps.length
    ? `<div class="follow-up-row" role="list" aria-label="Follow-up questions">${followUps.map((t) => `<button class="follow-chip" type="button" role="listitem">${escapeHtml(t)}</button>`).join("")}</div>`
    : "";

  wrap.innerHTML = `
    <div class="msg-av ${role === "bot" ? "bot" : "usr"}" aria-hidden="true">${label}</div>
    <div class="msg-body">
      <div class="msg-meta">${role === "bot" ? "CivicGuide" : "You"} · ${time}</div>
      <div class="msg-bubble">${html}${followHtml}</div>
    </div>`;

  wrap.querySelectorAll(".follow-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      askAbout(btn.textContent);
      logFirebase("follow_up_chip_clicked");
    });
  });
  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
}

/**
 * Show the animated typing indicator in the chat area while waiting for an AI response.
 * The indicator is an ARIA-labelled article element with three animated dots.
 */
function showTyping() {
  const typing = document.createElement("article");
  typing.id = "typing";
  typing.className = "message";
  typing.setAttribute("aria-label", "CivicGuide is thinking");
  typing.innerHTML = `
    <div class="msg-av bot" aria-hidden="true">CG</div>
    <div class="msg-body">
      <div class="msg-meta">CivicGuide · thinking...</div>
      <div class="msg-bubble">
        <div class="typing-indicator" aria-hidden="true">
          <div class="t-dot-anim"></div>
          <div class="t-dot-anim"></div>
          <div class="t-dot-anim"></div>
        </div>
      </div>
    </div>`;
  $("#messages-area").appendChild(typing);
}

/**
 * Remove the typing indicator from the chat area once the response arrives.
 */
function removeTyping() { $("#typing")?.remove(); }

/**
 * Toggle the global loading state and update the send button and status badge.
 * @param {boolean} value - True to enter loading state, false to exit
 */
function setLoading(value) {
  isLoading = value;
  $("#send-btn").disabled = value || !$("#chat-input").value.trim();
  setStatus(value ? "Thinking" : "Ready", value ? "loading" : "");
}

/**
 * Update the status badge text and CSS state class.
 * @param {string} text - Status label (e.g. "Ready", "Thinking", "Offline")
 * @param {string} [state=""] - CSS modifier class ("loading", "error", or "")
 */
function setStatus(text, state = "") {
  $("#status-text").textContent = text;
  $("#status-badge").className = `status-badge ${state}`.trim();
}

/**
 * Handle textarea input events: auto-resize, update character counter,
 * and enable/disable the send button.
 */
function onInputChange() {
  const input = $("#chat-input");
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  const count = input.value.length;
  const counter = $("#char-counter");
  counter.textContent = `${count} / 600`;
  counter.setAttribute("aria-label", `${count} of 600 characters used`);
  counter.className = `char-counter ${count > INPUT_LIMITS.QUESTION_DANGER ? "danger" : count > INPUT_LIMITS.QUESTION_WARN ? "warn" : ""}`.trim();
  $("#send-btn").disabled = isLoading || count === 0;
}

/**
 * Handle keydown in the chat textarea.
 * Enter submits; Shift+Enter inserts a newline.
 * @param {KeyboardEvent} e
 */
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

/* ─── Markdown → HTML ───────────────────────────────────────────────────────── */
/**
 * Convert a markdown-like string to safe HTML for rendering in the chat bubble.
 * Extracts <follow-up> tags, escapes all user-controlled content, and
 * converts headings, bold, italic, and lists.
 * @param {string} text - Raw markdown text (may include follow-up tags)
 * @returns {{ html: string, followUps: string[] }}
 */
function mdToHtml(text) {
  const followUps = [];
  let clean = String(text).replace(/<follow-up>(.*?)<\/follow-up>/gis, (_, q) => {
    followUps.push(q.trim());
    return "";
  });

  clean = escapeHtml(clean);
  clean = clean
    .replace(/^\[note:\s*(.*?)\]$/gim, '<div class="highlight-box">$1</div>')
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  const lines = clean.split(/\n/);
  const html = [];
  let listOpen = false;

  lines.forEach((line) => {
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (numbered || bullet) {
      if (!listOpen) { html.push("<ul>"); listOpen = true; }
      html.push(`<li>${numbered ? numbered[1] : bullet[1]}</li>`);
      return;
    }
    if (listOpen) { html.push("</ul>"); listOpen = false; }
    if (!line.trim()) return;
    if (line.startsWith("<h3>") || line.startsWith('<div class="highlight-box">')) {
      html.push(line);
    } else {
      html.push(`<p>${line}</p>`);
    }
  });

  if (listOpen) html.push("</ul>");
  return { html: html.join(""), followUps };
}

/* ─── Actions ───────────────────────────────────────────────────────────────── */
/**
 * Copy the full conversation text to the clipboard using the Clipboard API.
 * Falls back to a manual-select prompt if the API is unavailable.
 */
function copyConversation() {
  const text = $$(".msg-bubble")
    .map((el) => el.innerText.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
  if (!text) { showToast("No conversation to copy yet."); return; }
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast("Conversation copied.");
      logFirebase("conversation_copied");
    })
    .catch(() => showToast("Copy failed. Select the text manually."));
}

/**
 * Clear the chat history after user confirmation and restore the welcome message.
 */
function clearChat() {
  if (!window.confirm("Start a new conversation?")) return;
  $("#messages-area").innerHTML = "";
  history = [];
  addWelcome();
  showToast("New conversation started.");
  logFirebase("chat_cleared");
}

/**
 * Toggle the Google Maps polling-place panel open or closed.
 * Initializes the map on first open via initOrShowMap().
 */
function toggleMap() {
  const panel = $("#maps-panel");
  const expanded = $("#maps-toggle-btn").getAttribute("aria-expanded") === "true";
  panel.hidden = expanded;
  $("#maps-toggle-btn").setAttribute("aria-expanded", String(!expanded));
  $("#maps-toggle-label").textContent = expanded ? "Show Polling Map" : "Hide Polling Map";
  if (!expanded) {
    initOrShowMap();
    logFirebase("map_toggled", { action: "open", region });
  }
}

/* ─── Google Civic Information API ─────────────────────────────────────────── */
/**
 * Handle the Google Civic Information API form submission.
 * Validates the address, checks for a Google API key, calls the API,
 * and renders a structured result with polling location links.
 * @param {Event} event - The form submit event
 */
async function lookupCivicInfo(event) {
  event.preventDefault();
  const address = normalizeAddress($("#civic-address-input").value);
  const key = $("#google-api-key-input").value.trim();
  const result = $("#civic-api-result");

  if (!address) {
    result.textContent = "Enter a street address before checking official election information.";
    $("#civic-address-input").focus();
    return;
  }

  googleApiKey = key;
  try {
    if (googleApiKey) sessionStorage.setItem("cg_google_key", googleApiKey);
    else sessionStorage.removeItem("cg_google_key");
  } catch (_) {}

  if (!googleApiKey) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`official election information ${address}`)}`;
    result.innerHTML = `No Google API key added. <a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Open Google Search for official election sources →</a>`;
    logFirebase("civic_api_no_key", { region });
    return;
  }

  result.textContent = "Checking Google Civic Information API…";
  try {
    const data = await fetchGoogleCivicInfo(address, googleApiKey);
    const election = data.election?.name || "Election information";
    const normalized = data.normalizedInput;
    const place = normalized
      ? [normalized.line1, normalized.city, normalized.state, normalized.zip].filter(Boolean).join(", ")
      : address;
    const contests = Array.isArray(data.contests) ? data.contests.length : 0;
    const pollingLocations = Array.isArray(data.pollingLocations) ? data.pollingLocations.length : 0;
    const earlyVoting = Array.isArray(data.earlyVoteSites) ? data.earlyVoteSites.length : 0;

    let pollingHtml = "";
    if (Array.isArray(data.pollingLocations) && data.pollingLocations.length > 0) {
      const loc = data.pollingLocations[0];
      const locName = loc.address?.locationName || "";
      const locLine = [loc.address?.line1, loc.address?.city, loc.address?.state].filter(Boolean).join(", ");
      if (locName || locLine) {
        const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(`${locName} ${locLine}`)}`;
        pollingHtml = `<br><a href="${mapsLink}" target="_blank" rel="noopener noreferrer">📍 ${escapeHtml(locName || locLine)} — View on Google Maps →</a>`;
      }
    }

    result.innerHTML = `<strong>${escapeHtml(election)}</strong><br>${escapeHtml(place)}<br>${contests} contest(s) · ${pollingLocations} polling place(s) · ${earlyVoting} early voting site(s)${pollingHtml}`;
    logFirebase("civic_api_lookup", { region, success: true, contests, pollingLocations });
  } catch (err) {
    result.textContent = `Google Civic lookup unavailable: ${err.message}. Verify details with your official election authority.`;
    logFirebase("civic_api_error", { error: err.message, region });
  }
}

/**
 * Fetch official voter information from the Google Civic Information API.
 * Times out after 12 seconds.
 * @param {string} address - Normalized street address
 * @param {string} key - Google API key
 * @returns {Promise<Object>} Parsed JSON response from the Civic API
 * @throws {Error} On non-OK response or network failure
 */
async function fetchGoogleCivicInfo(address, key) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMINGS.CIVIC_TIMEOUT_MS);
  const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?key=${encodeURIComponent(key)}&address=${encodeURIComponent(address)}&officialOnly=true`;
  const response = await fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/* ─── Utilities ─────────────────────────────────────────────────────────────── */
/**
 * Normalize an address string: collapse whitespace and cap at 160 characters.
 * @param {unknown} value - Raw address input
 * @returns {string} Normalized address safe for API calls
 */
function normalizeAddress(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, INPUT_LIMITS.ADDRESS);
}

/**
 * Normalize a question string: collapse whitespace and cap at 600 characters.
 * @param {unknown} value - Raw question input
 * @returns {string} Normalized question safe for the API and display
 */
function normalizeQuestion(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, INPUT_LIMITS.QUESTION);
}

/**
 * Open or close the mobile navigation drawer.
 * @param {boolean|undefined} force - True to open, false to close, undefined to toggle
 */
function toggleMobileMenu(force) {
  const next = typeof force === "boolean" ? force : !document.body.classList.contains("nav-open");
  document.body.classList.toggle("nav-open", next);
  $("#mobile-menu-btn").setAttribute("aria-expanded", String(next));
  $("#mobile-menu-btn").setAttribute("aria-label", next ? "Close navigation" : "Open navigation");
  $("#mobile-scrim").hidden = !next;
}

/**
 * Sync the UI with the current online/offline state.
 * Triggers a background sync registration when connectivity is restored.
 */
function updateOnlineStatus() {
  const offline = !navigator.onLine;
  $("#offline-banner").hidden = !offline;
  if (offline) {
    setStatus("Offline", "error");
    logFirebase("went_offline");
  }
  if (!offline && !isLoading) {
    setStatus("Ready");
    // Trigger background sync when back online
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.sync.register("civicguide-sync").catch(() => {});
      });
    }
  }
}

/**
 * Display a temporary toast notification for 2.6 seconds.
 * Cancels any in-flight toast timer before showing the new message.
 * @param {string} message - Plain-text notification content
 */
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), TIMINGS.TOAST_MS);
}

/**
 * Escape a value for safe insertion into HTML.
 * Covers &, <, >, ", and ' to prevent XSS.
 * @param {unknown} value - Any value (coerced to string)
 * @returns {string} HTML-safe string
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function googleTranslateInit() {
  if (!window.google?.translate?.TranslateElement) return;
  new window.google.translate.TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages: "en,hi,es,fr,pt,ar,bn,ta,te,zh-CN,ru,de,ja",
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    },
    "google_translate_element"
  );
  logFirebase("google_translate_init");
}

/* ─── Exports ───────────────────────────────────────────────────────────────── */
window.googleTranslateInit = googleTranslateInit;
window.initGoogleMaps = initGoogleMaps;
window.handleMapsLoadError = handleMapsLoadError;

document.addEventListener("DOMContentLoaded", init);
