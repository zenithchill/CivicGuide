/**
 * CivicGuide v2.0.0 — Election Process Education Assistant
 *
 * Google Integrations:
 *   • Google Maps JS API (interactive polling-place map, geolocation)
 *   • Google Places Autocomplete (address lookup with markers)
 *   • Google Places Nearby Search (polling places near user)
 *   • Google Civic Information API (official voter info by address)
 *   • Google Calendar (deep-link event creation)
 *   • Google Search (dynamic election queries)
 *   • Google Translate (multi-language support)
 *   • Google Fonts (Cormorant Garamond, Outfit)
 *   • Google YouTube (region-specific video search links)
 *
 * Firebase Integrations:
 *   • Firebase Analytics — logEvent for all key user actions
 *   • Firebase Analytics — setUserProperties for region/mode
 *   • Firebase Firestore — store session question logs
 *   • Firebase Performance — automatic performance monitoring
 *
 * Other:
 *   • Claude Sonnet AI (Anthropic Messages API)
 *   • Service Worker PWA (offline cache, background sync)
 *   • Web Share API
 */

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
  logFirebase("page_view", { page: "civicguide_home", region });
  window.firebaseSetUserProperty?.("preferred_region", region);
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

/** Store a question log to Firestore */
async function storeQuestionLog(question, mode) {
  try {
    if (typeof window.firebaseAddDoc === "function" && window.firebaseDb) {
      await window.firebaseAddDoc(
        window.firebaseCollection(window.firebaseDb, "question_logs"),
        {
          question: question.slice(0, 200),
          region,
          mode,
          timestamp: window.firebaseServerTimestamp?.() ?? new Date()
        }
      );
    }
  } catch (_) {
    // Firestore may fail with demo config — continue silently
  }
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
function cacheKey() {
  try {
    apiKey = sessionStorage.getItem("cg_key") || "";
    googleApiKey = sessionStorage.getItem("cg_google_key") || "";
    const mode = sessionStorage.getItem("cg_mode") || "";
    if (googleApiKey) $("#google-api-key-input").value = googleApiKey;
    $("#api-modal").style.display = apiKey || mode === "offline" ? "none" : "flex";

    const statMode = $("#stat-mode");
    if (statMode) statMode.textContent = apiKey ? "AI" : mode === "offline" ? "Offline" : "—";
  } catch (_) {
    apiKey = "";
    googleApiKey = "";
    $("#api-modal").style.display = "flex";
  }
}

function saveKey() {
  const input = $("#api-key-input");
  const error = $("#api-key-error");
  const value = input.value.trim();
  if (!value || !value.startsWith("sk-")) {
    error.textContent = "Enter a valid Anthropic API key beginning with sk-.";
    input.focus();
    return;
  }
  apiKey = value;
  try {
    sessionStorage.setItem("cg_key", value);
    sessionStorage.setItem("cg_mode", "api");
  } catch (_) {}
  error.textContent = "";
  $("#api-modal").style.display = "none";
  const statMode = $("#stat-mode");
  if (statMode) statMode.textContent = "AI";
  showToast("Key saved for this browser session.");
  $("#chat-input").focus();
  logFirebase("api_key_saved");
  window.firebaseSetUserProperty?.("mode", "api");
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

function stepClass(index) {
  if (index === activeStep) return "active";
  if (index < activeStep) return "done";
  return "";
}

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

function topicIcon(name) {
  const icons = { checklist: "✓", ballot: "□", mail: "@", scale: "=", shield: "!", count: "#" };
  return icons[name] || "?";
}

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
function addWelcome() {
  addMsg("bot", `
    <p>Welcome. I am <strong>CivicGuide</strong>, a plain-language assistant for the <strong>Election Process Education</strong> challenge vertical.</p>
    <p>Choose a region, select a timeline step, or ask a question. I can explain registration, voting methods, vote counting, certification, security, and how to check official sources.</p>
    <p>Use the <strong>Google Services</strong> panel to find polling places on Google Maps, add election dates to Google Calendar, look up official info via the Google Civic Information API, or search with Google Translate in your language.</p>
    <div class="highlight-box">For legal deadlines or eligibility, always verify with your official election authority. Rules can change by country, state, province, or district.</div>
  `, ["Give me the full election timeline", "What should I check before voting?", "How do officials verify results?"]);
}

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

  const mode = apiKey ? "api" : "offline";
  sessionStats.questions++;
  updateSessionStats();
  logFirebase("question_asked", { region, mode });
  storeQuestionLog(text, mode);

  try {
    const raw = apiKey ? await callClaude(text) : localAnswer(text);
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

async function callClaude(message) {
  history.push({ role: "user", content: message });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 900,
      system: getSystemPrompt(),
      messages: history.slice(-12)
    })
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply = data.content?.[0]?.text || "I could not read the model response. Please try again.";
  history.push({ role: "assistant", content: reply });
  return reply;
}

function localAnswer(question) {
  const data = REGIONS[region] || REGIONS.GEN;
  const q = question.toLowerCase();
  const matched = FALLBACKS.find((item) => item.keys.some((key) => q.includes(key)));
  const body = matched
    ? matched.answer
    : `Here is the election process in plain language for ${data.name}: citizens check eligibility, register or update details, learn the candidates and issues, choose an approved voting method, cast a ballot, and then officials verify, count, audit, and certify the results. The exact dates, ID rules, and ballot options depend on your election authority.`;

  return `${body}

1. Confirm your eligibility and registration status.
2. Check official deadlines, ID rules, and ballot options.
3. Use trusted sources first: ${data.official}.
4. Save key dates in Google Calendar, use Google Maps to find election offices, and use the Google Civic Information API lookup when you have an address.

[note: This is built-in guidance. Add an Anthropic API key to enable dynamic AI answers.]

<follow-up>What official source should I check for my region?</follow-up>
<follow-up>Can you turn this into a voter checklist?</follow-up>`;
}

function askAbout(question) {
  toggleMobileMenu(false);
  sendMessage(question);
}

/* ─── Message rendering ─────────────────────────────────────────────────────── */
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

function removeTyping() { $("#typing")?.remove(); }

function setLoading(value) {
  isLoading = value;
  $("#send-btn").disabled = value || !$("#chat-input").value.trim();
  setStatus(value ? "Thinking" : "Ready", value ? "loading" : "");
}

function setStatus(text, state = "") {
  $("#status-text").textContent = text;
  $("#status-badge").className = `status-badge ${state}`.trim();
}

function onInputChange() {
  const input = $("#chat-input");
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  const count = input.value.length;
  const counter = $("#char-counter");
  counter.textContent = `${count} / 600`;
  counter.setAttribute("aria-label", `${count} of 600 characters used`);
  counter.className = `char-counter ${count > 560 ? "danger" : count > 500 ? "warn" : ""}`.trim();
  $("#send-btn").disabled = isLoading || count === 0;
}

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

/* ─── Markdown → HTML ───────────────────────────────────────────────────────── */
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

function clearChat() {
  if (!window.confirm("Start a new conversation?")) return;
  $("#messages-area").innerHTML = "";
  history = [];
  addWelcome();
  showToast("New conversation started.");
  logFirebase("chat_cleared");
}

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

async function fetchGoogleCivicInfo(address, key) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?key=${encodeURIComponent(key)}&address=${encodeURIComponent(address)}&officialOnly=true`;
  const response = await fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/* ─── Utilities ─────────────────────────────────────────────────────────────── */
function normalizeAddress(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 160);
}

function normalizeQuestion(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 600);
}

function toggleMobileMenu(force) {
  const next = typeof force === "boolean" ? force : !document.body.classList.contains("nav-open");
  document.body.classList.toggle("nav-open", next);
  $("#mobile-menu-btn").setAttribute("aria-expanded", String(next));
  $("#mobile-menu-btn").setAttribute("aria-label", next ? "Close navigation" : "Open navigation");
  $("#mobile-scrim").hidden = !next;
}

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

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

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
