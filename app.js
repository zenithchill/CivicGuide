const REGIONS = {
  US: {
    name: "United States",
    badge: "🇺🇸 United States",
    official: "usa.gov, vote.gov, eac.gov, state election offices",
    search: "United States election process voter registration official",
    calendarText: "Election Day",
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
 
let apiKey = "";
let googleApiKey = "";
let history = [];
let isLoading = false;
let region = "US";
let activeStep = 5;
 
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
 
function init() {
  cacheKey();
  bindEvents();
  buildTimeline();
  buildTopics();
  buildChips();
  updateRegion();
  updateOnlineStatus();
  addWelcome();
}
 
function cacheKey() {
  let mode = "";
  try {
    apiKey = sessionStorage.getItem("cg_key") || "";
    googleApiKey = sessionStorage.getItem("cg_google_key") || "";
    mode = sessionStorage.getItem("cg_mode") || "";
  } catch (error) {
    apiKey = "";
    googleApiKey = "";
  }
  if (googleApiKey) $("#google-api-key-input").value = googleApiKey;
  $("#api-modal").style.display = apiKey || mode === "offline" ? "none" : "flex";
}
 
function bindEvents() {
  $("#save-key-btn").addEventListener("click", saveKey);
  $("#demo-mode-btn").addEventListener("click", startOfflineMode);
  $("#api-key-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveKey();
  });
  $("#clear-key-btn").addEventListener("click", changeKey);
  $("#mobile-menu-btn").addEventListener("click", () => toggleMobileMenu());
  $("#mobile-scrim").addEventListener("click", () => toggleMobileMenu(false));
  $("#region-select").addEventListener("change", (event) => {
    region = event.target.value;
    history = [];
    updateRegion();
    toggleMobileMenu(false);
    showToast(`Region set to ${REGIONS[region].name}.`);
  });
  $("#chat-input").addEventListener("input", onInputChange);
  $("#chat-input").addEventListener("keydown", handleKey);
  $("#send-btn").addEventListener("click", () => sendMessage());
  $("#copy-btn").addEventListener("click", copyConversation);
  $("#clear-btn").addEventListener("click", clearChat);
  $("#print-btn").addEventListener("click", () => window.print());
  $("#maps-toggle-btn").addEventListener("click", toggleMap);
  $("#civic-api-form").addEventListener("submit", lookupCivicInfo);
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleMobileMenu(false);
  });
}
 
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
    btn.addEventListener("click", () => askAbout(question));
    el.appendChild(btn);
  });
}
 
function topicIcon(name) {
  const icons = {
    checklist: "✓",
    ballot: "□",
    mail: "@",
    scale: "=",
    shield: "!",
    count: "#"
  };
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
    btn.addEventListener("click", () => askAbout(chip));
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
    card.addEventListener("click", () => askAbout(`Explain this election fact for ${data.name}: ${num} - ${label}.`));
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
    el.appendChild(link);
  });
}
 
function updateGoogleLinks(data) {
  const query = encodeURIComponent(data.search);
  const mapsQuery = encodeURIComponent(`election office near me ${data.name}`);
  const calendarText = encodeURIComponent(data.calendarText);
  const details = encodeURIComponent(`Check official election dates and rules for ${data.name}. Start with: ${data.official}.`);
  const dates = "20261103T090000/20261103T100000";
  const [registerLabel, registerUrl] = REGISTRATION_LINKS[region] || REGISTRATION_LINKS.GEN;
 
  const searchLink = $$('.g-service-btn').find((link) => link.textContent.includes("Search Election Info"));
  const officeLink = $$('.g-service-btn').find((link) => link.textContent.includes("Find Election Office"));
  if (searchLink) searchLink.href = `https://www.google.com/search?q=${query}`;
  if (officeLink) officeLink.href = `https://www.google.com/maps/search/${mapsQuery}`;
  $("#register-service-link").href = registerUrl;
  $("#register-service-label").textContent = registerLabel;
  $("#gcal-btn").href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarText}&details=${details}&dates=${dates}`;
}
 
function addWelcome() {
  addMsg("bot", `
    <p>Welcome. I am <strong>CivicGuide</strong>, a plain-language assistant for the <strong>Election Process Education</strong> challenge vertical.</p>
    <p>Choose a region, select a timeline step, or ask a question. I can explain registration, voting methods, vote counting, certification, security, and how to check official sources.</p>
    <div class="highlight-box">For legal deadlines or eligibility, always verify with your official election authority. Rules can change by country, state, province, or district.</div>
  `, ["Give me the full election timeline", "What should I check before voting?", "How do officials verify results?"]);
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
  } catch (err) {
    apiKey = value;
  }
  error.textContent = "";
  $("#api-modal").style.display = "none";
  showToast("Key saved for this browser session.");
  $("#chat-input").focus();
}
 
function startOfflineMode() {
  apiKey = "";
  try {
    sessionStorage.removeItem("cg_key");
    sessionStorage.setItem("cg_mode", "offline");
  } catch (error) {
    // Offline mode still works if session storage is blocked.
  }
  $("#api-key-error").textContent = "";
  $("#api-modal").style.display = "none";
  showToast("Offline education mode enabled.");
  $("#chat-input").focus();
}
 
function changeKey() {
  try {
    sessionStorage.removeItem("cg_key");
    sessionStorage.removeItem("cg_mode");
  } catch (error) {
    // Session storage may be blocked; the in-memory key is cleared below.
  }
  apiKey = "";
  $("#api-key-input").value = "";
  $("#api-modal").style.display = "flex";
  $("#api-key-input").focus();
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
 
  try {
    const raw = apiKey ? await callClaude(text) : localAnswer(text);
    removeTyping();
    const rendered = mdToHtml(raw);
    addMsg("bot", rendered.html, rendered.followUps);
    setStatus("Ready");
  } catch (error) {
    removeTyping();
    setStatus("Connection issue", "error");
    const fallback = localAnswer(text);
    const rendered = mdToHtml(`${fallback}\n\n[note: Claude could not be reached: ${error.message}. I used CivicGuide's built-in offline guidance instead.]`);
    addMsg("bot", rendered.html, rendered.followUps);
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
  const body = matched ? matched.answer : `Here is the election process in plain language for ${data.name}: citizens check eligibility, register or update details, learn the candidates and issues, choose an approved voting method, cast a ballot, and then officials verify, count, audit, and certify the results. The exact dates, ID rules, and ballot options depend on your election authority.`;
 
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
 
function addMsg(role, html, followUps = []) {
  const area = $("#messages-area");
  const wrap = document.createElement("article");
  wrap.className = `message ${role === "user" ? "user" : ""}`;
  wrap.setAttribute("aria-label", role === "bot" ? "CivicGuide response" : "Your message");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const label = role === "bot" ? "CG" : "You";
  const followHtml = followUps.length
    ? `<div class="follow-up-row" role="list" aria-label="Follow-up questions">${followUps.map((text) => `<button class="follow-chip" type="button" role="listitem">${escapeHtml(text)}</button>`).join("")}</div>`
    : "";
 
  wrap.innerHTML = `
    <div class="msg-av ${role === "bot" ? "bot" : "usr"}" aria-hidden="true">${label}</div>
    <div class="msg-body">
      <div class="msg-meta">${role === "bot" ? "CivicGuide" : "You"} · ${time}</div>
      <div class="msg-bubble">${html}${followHtml}</div>
    </div>`;
 
  wrap.querySelectorAll(".follow-chip").forEach((button) => {
    button.addEventListener("click", () => askAbout(button.textContent));
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
 
function removeTyping() {
  $("#typing")?.remove();
}
 
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
 
function handleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}
 
function mdToHtml(text) {
  const followUps = [];
  let clean = String(text).replace(/<follow-up>(.*?)<\/follow-up>/gis, (_, question) => {
    followUps.push(question.trim());
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
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${numbered ? numbered[1] : bullet[1]}</li>`);
      return;
    }
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
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
 
function copyConversation() {
  const text = $$(".msg-bubble")
    .map((el) => el.innerText.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
  if (!text) {
    showToast("No conversation to copy yet.");
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showToast("Conversation copied."))
    .catch(() => showToast("Copy failed. Select the text manually."));
}
 
function clearChat() {
  const shouldClear = window.confirm("Start a new conversation?");
  if (!shouldClear) return;
  $("#messages-area").innerHTML = "";
  history = [];
  addWelcome();
  showToast("New conversation started.");
}
 
function toggleMap() {
  const panel = $("#maps-panel");
  const expanded = $("#maps-toggle-btn").getAttribute("aria-expanded") === "true";
  panel.hidden = expanded;
  $("#maps-toggle-btn").setAttribute("aria-expanded", String(!expanded));
  $("#maps-toggle-label").textContent = expanded ? "Show Polling Map" : "Hide Polling Map";
}

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
  } catch (error) {
    // Lookup still works if session storage is blocked.
  }

  if (!googleApiKey) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`official election information ${address}`)}`;
    result.innerHTML = `No Google API key added. <a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Open Google Search for official election sources</a>.`;
    return;
  }

  result.textContent = "Checking Google Civic Information API...";
  try {
    const data = await fetchGoogleCivicInfo(address, googleApiKey);
    const election = data.election?.name || "Election information";
    const normalized = data.normalizedInput;
    const place = normalized ? [normalized.line1, normalized.city, normalized.state, normalized.zip].filter(Boolean).join(", ") : address;
    const contests = Array.isArray(data.contests) ? data.contests.length : 0;
    const pollingLocations = Array.isArray(data.pollingLocations) ? data.pollingLocations.length : 0;
    result.innerHTML = `<strong>${escapeHtml(election)}</strong><br>${escapeHtml(place)}<br>${contests} contest(s) and ${pollingLocations} polling place result(s) returned by Google Civic Information API.`;
  } catch (error) {
    result.textContent = `Google Civic lookup unavailable: ${error.message}. Verify details with your official election authority.`;
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

function normalizeAddress(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 160);
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
  if (offline) setStatus("Offline", "error");
  if (!offline && !isLoading) setStatus("Ready");
}
 
function normalizeQuestion(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 600);
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
    { pageLanguage: "en", includedLanguages: "en,hi,es,fr,pt,ar,bn,ta,te", layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
    "google_translate_element"
  );
}
 
window.googleTranslateInit = googleTranslateInit;
document.addEventListener("DOMContentLoaded", init);
