/* JUZ40 CURATOR HUB — қосымша логикасы */
(function () {
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const uidGen = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayISO = () => new Date().toISOString().slice(0, 10);
const KZM = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
const fmtDate = iso => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d) ? "—" : `${d.getDate()} ${KZM[d.getMonth()]} ${d.getFullYear()}`; };
function newP() { return { done: {}, quiz: {}, books: {}, ch: {}, chStart: null, favs: [], refl: {}, cases: {}, tasks: {}, profile: {}, burnout: null, plan: {}, lastActive: null }; }

const S = {
  db: null, user: null, uid: null, sample: null, assets: null, downloads: null,
  isAdmin: false, asCurator: false, myName: "", canWrite: true, dbOk: false, ready: false,
  p: LS.get("j40p:anon", null) || newP(),
  items: [], cfg: { modules: { hidden: [] }, challenge: {}, ai: {}, platform: {} },
  scores: {}, board: [], allP: [], posts: [], names: {},
  view: "home", searchMode: false,
  ui: { admTab: "overview", acadTab: "quiz", gameCat: "Барлығы", libCat: "Барлығы", motCat: 0, parCat: 0, matCat: "Барлығы", matQ: "",
        openCase: null, quizSel: {}, quizRes: {}, sitSel: {}, chat: [], rp: null, rpLog: [], rpEval: "", gen: "", busy: {},
        certType: "best-student", fill: { st: "", pa: "", cu: "" }, search: "", bookPage: {}, userDetail: null, drafts: {}, upFile: null, caseAI: {} }
};
const isAdm = () => S.isAdmin && !S.asCurator;
const cfgAI = () => S.cfg.ai || {};
const aiOn = () => !!S.sample && (cfgAI().enabled !== false || isAdm());

/* ---------- ICONS ---------- */
const IC = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-6 6-6 9-1-1-2-2-2-4-1 2-1 4-1 7 0 4 3 7 7 7z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M8 14h.01M16 14h.01M9 18h6"/>',
  wand: '<path d="m15 4 5 5L9 20H4v-5z"/><path d="M13 6l5 5"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5.5 5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>',
  spark: '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5 19 19M5 19l3.5-3.5M15.5 8.5 19 5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
  family: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="15" r="2.2"/><path d="M2 21a5 5 0 0 1 10 0M12 21a5 5 0 0 1 10 0"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M15 11.5h.01M18 13.5h.01"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
  heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>', down: '<path d="M12 3v13M6 11l6 6 6-6M4 21h16"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  wa: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 9c0 3 2 6 6 6"/>',
  upload: '<path d="M12 21V8M6 13l6-6 6 6M4 3h16"/>', bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'
};
const icon = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n] || IC.star}</svg>`;

/* ---------- UTIL ---------- */
let toastT;
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
function copyText(t) {
  const fb = () => { const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); toast("Көшірілді ✓"); } catch (e) { toast("Көшіру мүмкін болмады"); } a.remove(); };
  try { navigator.clipboard.writeText(t).then(() => toast("Көшірілді ✓"), fb); } catch (e) { fb(); }
}
function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
function fillT(t) {
  const f = S.ui.fill, cu = f.cu || S.myName;
  return t.replace(/\{Аты\}|\{Оқушы аты\}/g, m => f.st || m).replace(/\{Ата-ана аты\}/g, m => f.pa || m).replace(/\{Куратор аты\}|\{Куратор\}/g, m => cu || m);
}
const draft = (k, d = "") => S.ui.drafts[k] != null ? S.ui.drafts[k] : d;

/* ---------- PROGRESS / XP ---------- */
const finishedBooks = p => Object.values(p.books || {}).filter(v => v >= 17).length;
function xpOf(p, uid) {
  const q = Object.values(p.quiz || {}).reduce((a, v) => a + Math.round(v / 2), 0);
  const sc = Object.values((S.scores[uid] || {})).reduce((a, v) => a + Math.round((+v || 0) / 2), 0);
  return Object.keys(p.done || {}).length * 50 + q + Object.keys(p.ch || {}).length * 10 + Object.keys(p.cases || {}).length * 30 + finishedBooks(p) * 40 + sc;
}
const boardRow = () => ({ xp: xpOf(S.p, S.uid), mods: Object.keys(S.p.done).length, ch: Object.keys(S.p.ch).length, cases: Object.keys(S.p.cases).length, books: finishedBooks(S.p), at: S.p.lastActive });
let saveT = null, saving = false, again = false, lastBoard = "";
function saveP() {
  S.p.lastActive = new Date().toISOString();
  LS.set("j40p:" + (S.uid || "anon"), S.p);
  clearTimeout(saveT); saveT = setTimeout(flush, 700);
}
async function flush() {
  if (!S.db || !S.uid || !S.canWrite) return;
  if (saving) { again = true; return; }
  saving = true;
  try {
    await S.db.doc("progress/" + S.uid).set(JSON.parse(JSON.stringify(S.p)));
    const b = boardRow(), bs = JSON.stringify({ ...b, at: 0 });
    if (bs !== lastBoard) { await S.db.doc("board/" + S.uid).set(b); lastBoard = bs; }
  } catch (e) {
    if (e && e.code === "invalid_argument") { S.canWrite = false; render(true); }
    else if (e && e.code === "quota_exceeded") toast("Деректер қоры толы");
  }
  saving = false;
  if (again) { again = false; flush(); }
}
async function dbSet(path, data) {
  if (!S.db) { toast("Деректер қоры қолжетімсіз"); return false; }
  try { await S.db.doc(path).set(data); return true; }
  catch (e) { toast(e && e.code === "invalid_argument" ? "Бұл әрекетке рұқсат жоқ" : "Сақтау қатесі, қайта көріңіз"); return false; }
}
async function dbDel(path) { try { await S.db.doc(path).delete(); return true; } catch (e) { toast("Жою мүмкін болмады"); return false; } }

/* ---------- SEARCH / REGISTRY ---------- */
let REG = {};
function buildIndex() {
  REG = {};
  const add = (k, t, body, r, kind) => REG[k] = { t, body, r, kind };
  D.modules.forEach(m => add("mod:" + m.id, m.n + ". " + m.title, m.desc, m.id, "Модуль"));
  D.values.forEach((v, i) => add("val:" + i, v.t, v.th, "m01", "Құндылық"));
  D.motivation.forEach((c, i) => c.items.forEach((t, j) => add(`mot:${i}:${j}`, c.cat, t, "m02", "Мотивация")));
  D.studentComm.forEach((c, i) => add("stc:" + i, c.t, c.algo.join(" ") + " " + c.dlg.map(d => d[1]).join(" "), "m03", "Оқушымен байланыс"));
  D.parentComm.forEach((c, i) => c.items.forEach((t, j) => add(`par:${i}:${j}`, c.cat, t, "m04", "Ата-анаға хабарлама")));
  D.games.forEach((g, i) => add("game:" + i, g.n, `${g.o} ${g.i}`, "m05", "Ойын"));
  D.materials.forEach((m, i) => add("mat:" + i, m.t, m.body, "m06", "Материал"));
  D.books.forEach(b => add("book:" + b.id, b.t, b.desc + " " + b.intro, "book-" + b.id, "Кітап"));
  D.cases.forEach(c => add("case:" + c.id, c.t, c.s, "m11", "Кейс"));
  S.items.forEach(it => {
    if (it.published === false && !isAdm()) return;
    const map = { material: ["Материал", "m06"], book: ["Кітап", "book-" + it.id], lesson: ["Сабақ", it.module || "modules"], quiz: ["Тест", "m09"], task: ["Тапсырма", it.module || "m09"], case: ["Кейс", "m11"], announce: ["Хабарландыру", "m18"] }[it.type];
    if (map) add("item:" + it.id, it.title || "", it.body || it.desc || it.s || "", map[1], map[0]);
  });
}
const isFav = k => (S.p.favs || []).includes(k);
const favBtn = (k) => `<button class="iconbtn ${isFav(k) ? "on" : ""}" data-a="fav" data-k="${esc(k)}" title="Таңдаулыға қосу">${icon("star", 18)}</button>`;
const copyBtn = (txt, label = "") => `<button class="btn sm" data-a="copy" data-t="${esc(txt)}">${icon("copy", 15)}${label || "Көшіру"}</button>`;

/* ---------- ART (book covers / illustrations) ---------- */
let artN = 0;
function art(c, a, motif, w = 300, h = 400, seed = 1) {
  const gid = "ag" + (++artN);
  const r = n => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 * n; };
  let dots = ""; for (let i = 0; i < 18; i++) dots += `<circle cx="${r(w)}" cy="${r(h)}" r="${1 + r(2.5)}" fill="${a}" opacity="${.25 + r(.5)}"/>`;
  const cx = w * .5, cy = h * .42, R = Math.min(w, h) * .26;
  const glyph = {
    gem: `<path d="M${cx - R * .7} ${cy - R * .25}l${R * .35} -${R * .45}h${R * .7}l${R * .35} ${R * .45}-${R * .7} ${R * .95}z" fill="none" stroke="${a}" stroke-width="3"/>`,
    chat: `<rect x="${cx - R * .8}" y="${cy - R * .6}" width="${R * 1.1}" height="${R * .75}" rx="14" fill="none" stroke="${a}" stroke-width="3"/><rect x="${cx - R * .2}" y="${cy - R * .05}" width="${R}" height="${R * .65}" rx="14" fill="${a}" opacity=".35"/>`,
    spark: `<path d="M${cx} ${cy - R}L${cx + R * .22} ${cy - R * .22}L${cx + R} ${cy}L${cx + R * .22} ${cy + R * .22}L${cx} ${cy + R}L${cx - R * .22} ${cy + R * .22}L${cx - R} ${cy}L${cx - R * .22} ${cy - R * .22}z" fill="${a}" opacity=".8"/>`,
    family: `<circle cx="${cx - R * .45}" cy="${cy - R * .2}" r="${R * .32}" fill="none" stroke="${a}" stroke-width="3"/><circle cx="${cx + R * .45}" cy="${cy - R * .2}" r="${R * .32}" fill="none" stroke="${a}" stroke-width="3"/><circle cx="${cx}" cy="${cy + R * .45}" r="${R * .22}" fill="${a}" opacity=".7"/>`,
    people: [0, 1, 2, 3, 4].map(i => `<circle cx="${cx + Math.cos(i * 1.2566) * R * .62}" cy="${cy + Math.sin(i * 1.2566) * R * .62}" r="${R * .18}" fill="${a}" opacity="${.4 + i * .12}"/>`).join(""),
    scale: `<path d="M${cx} ${cy - R}v${R * 1.6}M${cx - R * .8} ${cy - R * .55}h${R * 1.6}" stroke="${a}" stroke-width="3"/><path d="M${cx - R * .8} ${cy - R * .55}l-${R * .25} ${R * .55}h${R * .5}zM${cx + R * .8} ${cy - R * .55}l-${R * .25} ${R * .55}h${R * .5}z" fill="${a}" opacity=".6"/>`,
    loop: `<path d="M${cx - R * .7} ${cy}a${R * .7} ${R * .7} 0 1 1 ${R * .2} ${R * .5}" fill="none" stroke="${a}" stroke-width="4"/><path d="M${cx - R * .62} ${cy + R * .62}l-${R * .05} -${R * .3} ${R * .3} ${R * .05}" fill="none" stroke="${a}" stroke-width="4"/>`,
    storm: `<path d="M${cx + R * .1} ${cy - R}L${cx - R * .45} ${cy + R * .1}H${cx}L${cx - R * .15} ${cy + R}L${cx + R * .5} ${cy - R * .15}H${cx + R * .02}z" fill="${a}" opacity=".85"/>`
  }[motif] || "";
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#0a1128"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${gid})"/><circle cx="${w * .85}" cy="${h * .1}" r="${w * .45}" fill="${a}" opacity=".08"/><circle cx="${cx}" cy="${cy}" r="${R * 1.35}" fill="none" stroke="${a}" stroke-opacity=".25" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${R * 1.7}" fill="none" stroke="${a}" stroke-opacity=".12" stroke-width="1"/>${dots}${glyph}</svg>`;
}

/* ---------- SHELL ---------- */
function navItems() {
  const it = [
    ["home", "home", "Басты бет"], ["modules", "grid", "Модульдер"], ["m08", "book", "Кітапхана"], ["m09", "cap", "Академия"],
    ["m11", "sword", "Case Battle"], ["m12", "flame", "30 күндік челлендж"], ["m13", "bot", "AI Ментор"], ["m14", "wand", "AI генератор"],
    ["m18", "people", "Қауымдастық"], ["favorites", "star", "Таңдаулылар"], ["m10", "user", "Жеке профиль"]
  ];
  return it.filter(x => !(["m13", "m14"].includes(x[0]) && !aiOn()));
}
function shell() {
  const v = S.view, P = S.cfg.platform || {};
  const nav = navItems().map(([r, ic, t]) => `<a href="#${r}" class="${v === r ? "on" : ""}">${icon(ic)}<span>${t}</span></a>`).join("");
  $("#side").innerHTML = `
    <div class="brandbox"><div class="brand"><div class="logo">J40</div><div>${esc(P.name || "JUZ40 CURATOR HUB")}<small>${esc(P.philosophy || "БІЛІМ · ҚҰНДЫЛЫҚ · БАЙЛАНЫС · НӘТИЖЕ")}</small></div></div></div>
    <nav class="nav">${nav}${S.isAdmin ? `<div class="sep">Басқару</div><a href="#admin" class="${v === "admin" ? "on" : ""}">${icon("shield")}<span>Әкімшілік кабинеті</span></a>` : ""}</nav>
    <div class="sidefoot"><div class="row between"><span class="rolechip">${icon(isAdm() ? "shield" : "user", 14)}${isAdm() ? "Әкімші" : "Куратор"}</span>
    ${S.isAdmin ? `<button class="btn sm ghost" style="color:#c6cde2;border-color:rgba(255,255,255,.15)" data-a="toggleView">${S.asCurator ? "Әкімші көрінісі" : "Куратор көрінісі"}</button>` : ""}</div></div>`;
  const bn = [["home", "home", "Басты"], ["modules", "grid", "Модульдер"], ["m08", "book", "Кітаптар"], [aiOn() ? "m13" : "m12", aiOn() ? "bot" : "flame", aiOn() ? "AI" : "Челлендж"], [S.isAdmin ? "admin" : "m10", S.isAdmin ? "shield" : "user", S.isAdmin ? "Әкімші" : "Профиль"]];
  $("#bnav").innerHTML = bn.map(([r, ic, t]) => `<a href="#${r}" class="${v === r ? "on" : ""}">${icon(ic, 21)}<span>${t}</span></a>`).join("");
}

/* ---------- RENDER ---------- */
let pending = false;
function render(force) {
  const ae = document.activeElement, view = $("#view");
  if (!force && ae && view.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) { pending = true; return; }
  pending = false;
  const y = window.scrollY;
  shell();
  let html = "";
  try {
    if (S.searchMode && S.ui.search.trim()) html = vSearch();
    else html = route2html(S.view);
  } catch (e) { console.error(e); html = `<div class="empty">Бетті көрсету кезінде қате шықты.</div>`; }
  view.innerHTML = banner() + html;
  window.scrollTo(0, y);
  after();
}
document.addEventListener("focusout", () => { if (pending) setTimeout(() => render(), 50); });
function banner() {
  if (!S.ready) return "";
  if (!S.db) return `<div class="banner">Деректер қорына қосылу жоқ: прогресіңіз тек осы браузерде сақталады.</div>`;
  if (!S.canWrite) return `<div class="banner">Прогресті ортақ қорға сақтау үшін әкімшіден «Contributor» (қатысушы) рұқсатын сұраңыз. Әзірге прогресс осы құрылғыда сақталады.</div>`;
  return "";
}
function route2html(v) {
  if (v === "home") return vHome();
  if (v === "modules") return vModules();
  if (v === "favorites") return vFav();
  if (v === "admin") return S.isAdmin ? vAdmin() : vHome();
  if (v.startsWith("book-")) return vBook(v.slice(5));
  if (/^m\d\d$/.test(v)) return vModule(v);
  return vHome();
}
function route() {
  S.view = (location.hash || "#home").slice(1) || "home";
  S.searchMode = false; S.ui.search = ""; const q = $("#q"); if (q) q.value = "";
  render(true); window.scrollTo(0, 0);
}
const visibleMods = () => D.modules.filter(m => isAdm() || !(S.cfg.modules && (S.cfg.modules.hidden || []).includes(m.id)));

/* ---------- HOME ---------- */
function vHome() {
  const P = S.cfg.platform || {};
  const mods = visibleMods(), done = mods.filter(m => S.p.done[m.id]).length, pct = mods.length ? Math.round(done / mods.length * 100) : 0;
  const hr = new Date().getHours(), greet = hr < 12 ? "Қайырлы таң" : hr < 18 ? "Қайырлы күн" : "Қайырлы кеш";
  const q = D.dailyQuotes[Math.floor(Date.now() / 864e5) % D.dailyQuotes.length];
  const mot = D.motivation[0].items[Math.floor(Date.now() / 864e5) % D.motivation[0].items.length];
  const anns = S.items.filter(i => i.type === "announce").sort((a, b) => (b.at || "").localeCompare(a.at || "")).slice(0, 2);
  const recent = S.items.filter(i => ["material", "book", "lesson", "quiz", "case", "task"].includes(i.type) && i.published !== false).sort((a, b) => (b.at || "").localeCompare(a.at || "")).slice(0, 4);
  const recBooks = D.books.filter(b => (S.p.books[b.id] || 0) < 17).slice(0, 3);
  const chDay = chCurrentDay(), chTasks = chList();
  const ach = D.achievements.filter(a => a.test(S.p));
  const next = mods.find(m => !S.p.done[m.id]);
  return `
  <section class="hero"><div class="row between" style="position:relative;z-index:1;align-items:center;gap:20px">
    <div style="flex:1;min-width:240px"><div class="tiny" style="letter-spacing:.14em;color:var(--gold2);font-weight:700">${esc(P.name || "JUZ40 CURATOR HUB")}</div>
      <h1>${greet}${S.myName ? ", " + esc(S.myName.split(" ")[0]) : ""}! 👋</h1>
      <p class="q">«${esc(P.slogan || "Кураторлық – жай міндет емес, адамға әсер ету өнері")}».</p>
      ${next ? `<a class="btn gold" href="#${next.id}">${icon("right", 16)}Жалғастыру: ${esc(next.title)}</a>` : `<span class="tag gold">Барлық модуль аяқталды 🎉</span>`}
    </div>
    <div class="row" style="gap:16px"><div class="ring" style="--p:${pct}"><span>${pct}%</span></div><div class="small" style="color:#cfd5e8">Оқу прогресі<br><b style="color:#fff">${done}/${mods.length}</b> модуль<br><b style="color:#fff">${xpOf(S.p, S.uid)}</b> XP</div></div>
  </div></section>
  ${anns.map(a => `<div class="card mt" style="border-left:4px solid var(--gold)"><div class="row between"><b>${icon("bell", 16)} ${esc(a.title)}</b><span class="tiny muted">${fmtDate(a.at)}</span></div><div class="prose small mt" style="margin-top:6px">${esc(a.body)}</div></div>`).join("")}
  <div class="grid g3 mt">
    <div class="card"><div class="tiny muted" style="font-weight:700;letter-spacing:.08em">КҮН ОЙЫ</div><p class="disp" style="font-size:17px;font-weight:700;margin-top:8px">«${esc(q)}»</p></div>
    <div class="card"><div class="tiny muted" style="font-weight:700;letter-spacing:.08em">БҮГІНГІ МОТИВАЦИЯ</div><p style="margin-top:8px">${esc(mot)}</p>${copyBtn(mot)}</div>
    <div class="card"><div class="row between"><div class="tiny muted" style="font-weight:700;letter-spacing:.08em">${esc((S.cfg.challenge && S.cfg.challenge.title) || "30 КҮНДІК ЧЕЛЛЕНДЖ")}</div><span class="tag gold">${Object.keys(S.p.ch).length}/30</span></div>
      ${S.p.chStart ? `<p style="margin-top:8px"><b>${chDay}-күн:</b> ${esc(chTasks[chDay - 1] || "")}</p>${S.p.ch[chDay] ? `<span class="tag ok">Орындалды ✓</span>` : `<button class="btn sm pri" data-a="chDone" data-d="${chDay}">${icon("check", 15)}Орындадым</button>`}` : `<p style="margin-top:8px">Күн сайын бір кәсіби қадам. Бүгін бастаңыз!</p><button class="btn sm pri" data-a="chStart">Челленджді бастау</button>`}
    </div>
  </div>
  ${aiOn() ? `<div class="sectionhead"><h2>AI құралдары</h2></div>
  <div class="grid g4 keep2">
    <a class="card modcard" href="#m13"><div class="modicon">${icon("bot")}</div><b>AI Ментор</b><span class="small muted">Кез келген кураторлық сұрақ</span></a>
    <a class="card modcard" href="#m14" data-a="genPreset" data-k="mot"><div class="modicon">${icon("spark")}</div><b>Мотивациялық хабарлама</b><span class="small muted">Жағдайға сай мәтін</span></a>
    <a class="card modcard" href="#m14" data-a="genPreset" data-k="par"><div class="modicon">${icon("family")}</div><b>Ата-анаға хабарлама</b><span class="small muted">WhatsApp-қа дайын</span></a>
    <a class="card modcard" href="#m09" data-a="acad" data-t="rp"><div class="modicon">${icon("chat")}</div><b>Рөлдік жаттығу</b><span class="small muted">AI-мен қиын әңгіме</span></a>
  </div>` : ""}
  <div class="sectionhead"><h2>Жаңадан қосылғандар</h2><a href="#m06" class="small">Барлық материалдар →</a></div>
  ${recent.length ? `<div class="grid g4 keep2">${recent.map(i => `<a class="card modcard" href="#${i.type === "book" ? "book-" + i.id : i.type === "case" ? "m11" : i.type === "quiz" ? "m09" : i.type === "material" ? "m06" : (i.module || "modules")}"><span class="tag gold">${esc({ material: "Материал", book: "Кітап", lesson: "Сабақ", quiz: "Тест", case: "Кейс", task: "Тапсырма" }[i.type])}</span><b>${esc(i.title)}</b><span class="tiny muted">${fmtDate(i.at)}</span></a>`).join("")}</div>` : `<div class="empty small">Әкімші жаңа материал қосқанда, олар осында көрінеді.</div>`}
  <div class="sectionhead"><h2>Ұсынылатын кітаптар</h2><a href="#m08" class="small">Кітапхана →</a></div>
  <div class="grid g3">${recBooks.map(bookCard).join("")}</div>
  <div class="sectionhead"><h2>Жетістіктерім</h2><a href="#m10" class="small">Профиль →</a></div>
  <div class="grid g4 keep2">${D.achievements.slice(0, 8).map(achCard).join("")}</div>
  <p class="tiny muted mt">${ach.length}/${D.achievements.length} жетістік ашылды</p>`;
}
const achCard = a => { const got = a.test(S.p); return `<div class="ach ${got ? "got" : ""}"><div class="medal">${icon("award", 20)}</div><div><b class="small">${esc(a.t)}</b><div class="tiny muted">${esc(a.d)}</div></div></div>`; };

/* ---------- MODULES GRID ---------- */
function vModules() {
  const hidden = (S.cfg.modules && S.cfg.modules.hidden) || [];
  return `<h1>18 оқу модулі</h1><p class="muted">Әр модуль — кураторлық шеберліктің бір қыры. Модульді аяқтаған соң, «Аяқтадым» белгісін қойыңыз.</p>
  <div class="grid g3 mt">${visibleMods().map(m => `
    <a class="card modcard" href="#${m.id}">
      ${S.p.done[m.id] ? `<span class="done-badge tag ok">${icon("check", 13)} Аяқталды</span>` : isAdm() && hidden.includes(m.id) ? `<span class="done-badge tag bad">Жасырын</span>` : ""}
      <div class="row"><div class="modicon">${icon(m.icon)}</div><span class="modnum">МОДУЛЬ ${m.n}</span></div>
      <h3 style="margin:4px 0 0">${esc(m.title)}</h3><span class="small muted">${esc(m.desc)}</span>
    </a>`).join("")}</div>`;
}

/* ---------- MODULE PAGE ---------- */
function vModule(id) {
  const m = D.modules.find(x => x.id === id);
  if (!m) return vHome();
  if (!visibleMods().includes(m)) return `<div class="empty">Бұл модуль әзірге жарияланбаған.</div>`;
  const body = (MR[id] || (() => ""))();
  const lessons = S.items.filter(i => i.type === "lesson" && i.module === id && (i.published !== false || isAdm()));
  const tasks = S.items.filter(i => i.type === "task" && i.module === id && (i.published !== false || isAdm()));
  const noDone = ["m10"].includes(id);
  return `
  <div class="row between mb" style="align-items:flex-start">
    <div style="flex:1;min-width:240px"><a href="#modules" class="small muted" style="text-decoration:none">← Модульдер</a>
      <div class="modnum mt" style="margin-top:10px">МОДУЛЬ ${m.n}</div><h1>${esc(m.title)}</h1><p class="muted">${esc(m.desc)}</p></div>
    ${noDone ? "" : `<button class="btn ${S.p.done[id] ? "" : "pri"}" data-a="done" data-m="${id}">${icon("check", 16)}${S.p.done[id] ? "Аяқталды ✓" : "Модульді аяқтадым"}</button>`}
  </div>
  ${body}
  ${lessons.length ? `<div class="sectionhead"><h2>Қосымша сабақтар</h2></div><div class="list">${lessons.map(l => `<details class="item"><summary><span>${esc(l.title)} ${l.published === false ? '<span class="tag bad">Жасырын</span>' : ""}</span>${favBtn("item:" + l.id)}</summary><div class="prose">${esc(l.body)}</div></details>`).join("")}</div>` : ""}
  ${tasks.length ? `<div class="sectionhead"><h2>Практикалық тапсырмалар</h2></div><div class="list">${tasks.map(taskCard).join("")}</div>` : ""}`;
}
function taskCard(t) {
  const ans = S.p.tasks[t.id];
  return `<div class="item"><div class="row between"><b>${esc(t.title)}</b>${ans ? `<span class="tag ok">Тапсырылды</span>` : `<span class="tag">Күтуде</span>`}</div><p class="prose small mt" style="margin-top:6px">${esc(t.body)}</p>
  <textarea class="in" data-draft="task:${t.id}" placeholder="Жауабыңыз...">${esc(draft("task:" + t.id, ans ? ans.text : ""))}</textarea>
  <div class="row mt" style="margin-top:8px"><button class="btn sm pri" data-a="taskSave" data-id="${t.id}">Тапсыру</button>${ans ? `<span class="tiny muted">${fmtDate(ans.at)}</span>` : ""}</div></div>`;
}
const fillBar = (parent) => `<div class="card mb"><div class="small muted mb" style="margin-bottom:6px">Есімдерді енгізіңіз — көшірген мәтінде автоматты түрде ауыстырылады</div><div class="grid ${parent ? "g3" : "g2"}">
  <input class="in" data-fill="st" placeholder="Оқушы аты" value="${esc(S.ui.fill.st)}">
  ${parent ? `<input class="in" data-fill="pa" placeholder="Ата-ана аты" value="${esc(S.ui.fill.pa)}">` : ""}
  <input class="in" data-fill="cu" placeholder="Куратор аты" value="${esc(S.ui.fill.cu || S.myName)}"></div></div>`;
const chips = (arr, cur, act) => `<div class="tabs">${arr.map(c => `<button class="chip ${c === cur ? "on" : ""}" data-a="${act}" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
const reflBox = (k, q) => `<div class="mt" style="margin-top:12px"><label class="lb">✍️ Рефлексия: ${esc(q)}</label><textarea class="in" data-refl="${esc(k)}" placeholder="Ойыңызды жазыңыз — автоматты сақталады">${esc((S.p.refl[k] || {}).text || "")}</textarea></div>`;

const MR = {};
MR.m01 = () => `<div class="list">${D.values.map((v, i) => `
  <details class="item" ${i === 0 ? "open" : ""}><summary><span>${String(i + 1).padStart(2, "0")} · ${esc(v.t)}</span>${favBtn("val:" + i)}</summary>
  <h4>Теория</h4><p>${esc(v.th)}</p>
  <h4>Практикалық мысал</h4><div class="tpl">${esc(v.ex)}</div>
  ${reflBox("val:" + i, v.rq)}</details>`).join("")}</div>`;

MR.m02 = () => {
  const c = D.motivation[S.ui.motCat] || D.motivation[0];
  return `${fillBar(false)}${chips(D.motivation.map(x => x.cat), c.cat, "motCat")}
  <div class="list">${c.items.map((t, j) => { const k = `mot:${S.ui.motCat}:${j}`; return `<div class="item"><div class="tpl">${esc(fillT(t))}</div><div class="row mt" style="margin-top:10px">${copyBtn(fillT(t))}${favBtn(k)}</div></div>`; }).join("")}</div>
  ${aiOn() ? `<div class="card mt"><b>Басқа жағдай керек пе?</b><p class="small muted">AI генератор жағдайыңызға сай жаңа мәтін жазып береді.</p><a class="btn pri" href="#m14" data-a="genPreset" data-k="mot">${icon("wand", 16)}AI-мен жасау</a></div>` : ""}`;
};
MR.m03 = () => `<div class="list">${D.studentComm.map((c, i) => `
  <details class="item" ${i === 0 ? "open" : ""}><summary><span>${esc(c.t)}</span>${favBtn("stc:" + i)}</summary>
  <div class="grid g2"><div><h4>Байланыс алгоритмі</h4><ol class="steps">${c.algo.map(a => `<li>${esc(a)}</li>`).join("")}</ol></div>
  <div><h4>Диалог үлгісі</h4><div class="dlg">${c.dlg.map(d => `<div class="bub ${d[0] === "Куратор" ? "c" : "s"}"><span class="who">${esc(d[0])}</span>${esc(fillT(d[1]))}</div>`).join("")}</div>
  <div class="mt" style="margin-top:10px">${copyBtn(c.dlg.filter(d => d[0] === "Куратор").map(d => fillT(d[1])).join("\n\n"), "Куратор сөздерін көшіру")}</div></div></div></details>`).join("")}</div>`;
MR.m04 = () => {
  const c = D.parentComm[S.ui.parCat] || D.parentComm[0];
  return `${fillBar(true)}${chips(D.parentComm.map(x => x.cat), c.cat, "parCat")}
  <div class="list">${c.items.map((t, j) => { const k = `par:${S.ui.parCat}:${j}`, txt = fillT(t); return `<div class="item"><div class="tpl">${esc(txt)}</div><div class="row mt" style="margin-top:10px">${copyBtn(txt, "WhatsApp-қа көшіру")}<a class="btn sm" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">${icon("wa", 15)}WhatsApp-та ашу</a>${favBtn(k)}</div></div>`; }).join("")}</div>`;
};
MR.m05 = () => {
  const cats = ["Барлығы", ...new Set(D.games.map(g => g.c))];
  const list = D.games.map((g, i) => [g, i]).filter(([g]) => S.ui.gameCat === "Барлығы" || g.c === S.ui.gameCat);
  return `<p class="muted">${D.games.length} ойын · әрқайсысында мақсат, ұзақтық, нұсқаулық, куратор сценарийі және сұрақтар бар.</p>${chips(cats, S.ui.gameCat, "gameCat")}
  <div class="grid g2">${list.map(([g, i]) => `
    <details class="item"><summary><span><span class="tag gold">${esc(g.c)}</span><br>${esc(g.n)}</span>${favBtn("game:" + i)}</summary>
    <div class="kv"><b>Мақсаты</b><span>${esc(g.o)}</span><b>Ұзақтығы</b><span>${esc(g.d)}</span><b>Қатысушылар</b><span>${esc(g.p)}</span><b>Материалдар</b><span>${esc(g.m)}</span><b>Нұсқаулық</b><span>${esc(g.i)}</span></div>
    <h4 class="mt">Куратор сценарийі</h4><div class="tpl">${esc(g.s)}</div>
    <h4 class="mt">Талқылау сұрақтары</h4><ul class="small">${g.q.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <div class="row between"><span class="small"><b>Күтілетін нәтиже:</b> ${esc(g.r)}</span>${copyBtn(`${g.n}\nМақсаты: ${g.o}\nУақыты: ${g.d}\nНұсқаулық: ${g.i}\nСценарий: ${g.s}`)}</div></details>`).join("")}</div>`;
};
MR.m06 = () => {
  const adm = S.items.filter(i => i.type === "material" && (i.published !== false || isAdm()));
  const all = [...D.materials.map((m, i) => ({ k: "mat:" + i, cat: m.cat, t: m.t, body: m.body })), ...adm.map(i => ({ k: "item:" + i.id, cat: i.cat || "Жаңа материал", t: i.title, body: i.body || "", url: i.url, file: i.fileName, hidden: i.published === false }))];
  const cats = ["Барлығы", ...new Set(all.map(x => x.cat))];
  const q = S.ui.matQ.toLowerCase();
  const list = all.filter(x => (S.ui.matCat === "Барлығы" || x.cat === S.ui.matCat) && (!q || (x.t + " " + x.body).toLowerCase().includes(q)));
  return `${fillBar(false)}<input class="in mb" data-bind="matQ" placeholder="Материалдар ішінен іздеу..." value="${esc(S.ui.matQ)}">${chips(cats, S.ui.matCat, "matCat")}
  <div class="list">${list.length ? list.map(x => `<details class="item"><summary><span><span class="tag gold">${esc(x.cat)}</span> ${x.hidden ? '<span class="tag bad">Жасырын</span>' : ""}<br>${esc(x.t)}</span>${favBtn(x.k)}</summary>
    ${x.body ? `<div class="tpl">${esc(fillT(x.body))}</div>` : ""}<div class="row mt" style="margin-top:10px">${x.body ? copyBtn(fillT(x.body)) : ""}${x.url ? `<a class="btn sm" href="${esc(x.url)}" target="_blank" rel="noopener">${icon("down", 15)}${esc(x.file || "Файлды ашу")}</a>` : ""}</div></details>`).join("") : `<div class="empty">Ештеңе табылмады</div>`}</div>`;
};

/* M07 сертификаттар */
function certTypes() { return [...D.certTypes, ...S.items.filter(i => i.type === "certtpl").map(i => ({ k: "tpl-" + i.id, t: i.title, sub: i.sub, c1: i.c1 || "#0f1b3d", c2: i.c2 || "#d4a548", custom: i.id }))]; }
MR.m07 = () => {
  const types = certTypes(), ct = types.find(t => t.k === S.ui.certType) || types[0];
  const mine = S.items.filter(i => i.type === "cert" && i.recipientId === S.uid);
  return `<div class="grid g2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)">
  <div class="card"><h3>Design Studio</h3>
    <label class="lb">Сертификат түрі</label><select class="in" data-bind="certType">${types.map(t => `<option value="${t.k}" ${t.k === ct.k ? "selected" : ""}>${esc(t.t)}</option>`).join("")}</select>
    <label class="lb">Алушының аты-жөні</label><input class="in" data-draft="cert:name" data-live="cert" value="${esc(draft("cert:name", ""))}" placeholder="Мысалы: Айгерім Сейітқызы">
    <label class="lb">Қосымша мәтін</label><input class="in" data-draft="cert:sub" data-live="cert" value="${esc(draft("cert:sub", ct.sub))}">
    <div class="grid g2"><div><label class="lb">Күні</label><input class="in" type="date" data-draft="cert:date" data-live="cert" value="${esc(draft("cert:date", todayISO()))}"></div>
    <div><label class="lb">Берген</label><input class="in" data-draft="cert:by" data-live="cert" value="${esc(draft("cert:by", S.myName || "JUZ40 Curator Hub"))}"></div></div>
    <div class="row mt">${S.downloads ? `<button class="btn pri" data-a="certDl" data-f="png">${icon("down", 16)}PNG</button><button class="btn" data-a="certDl" data-f="pdf">${icon("down", 16)}PDF</button>` : `<span class="small muted">Жүктеу бұл көріністе қолжетімсіз — суретті тінтуірдің оң жағымен сақтауға болады.</span>`}</div>
  </div>
  <div><canvas id="certCanvas" class="certprev" width="1600" height="1130"></canvas><p class="tiny muted mt" style="margin-top:6px">Алдын ала көрініс. Барлық 8 түр және әкімші қосқан үлгілер қолжетімді.</p></div></div>
  <div class="sectionhead"><h2>Менің сертификаттарым</h2></div>
  ${mine.length ? `<div class="grid g3">${mine.map(c => `<div class="item"><span class="tag gold">${icon("award", 13)} ${esc(c.title)}</span><p class="small mt" style="margin-top:6px">${esc(c.sub || "")}</p><div class="row between"><span class="tiny muted">${fmtDate(c.date || c.at)}</span>${S.downloads ? `<button class="btn sm" data-a="myCertDl" data-id="${c.id}">${icon("down", 14)}PDF</button>` : ""}</div></div>`).join("")}</div>` : `<div class="empty small">Әкімші сізге сертификат бергенде, ол осында пайда болады.</div>`}`;
};
async function drawCert(cv, o) {
  try { await Promise.all([document.fonts.load('800 60px Montserrat', "СЕРТИФИКАТ әғқңөұүі"), document.fonts.load('600 30px Inter', "әғқңөұүі")]); } catch (e) {}
  const x = cv.getContext("2d"), W = cv.width, H = cv.height;
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, o.c1); g.addColorStop(1, "#0a1128");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = "#fbf7ee"; x.fillRect(60, 60, W - 120, H - 120);
  x.strokeStyle = o.c2; x.lineWidth = 6; x.strokeRect(84, 84, W - 168, H - 168); x.lineWidth = 1.5; x.strokeRect(100, 100, W - 200, H - 200);
  x.fillStyle = o.c2; [[84, 84], [W - 84, 84], [84, H - 84], [W - 84, H - 84]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 14, 0, 7); x.fill(); });
  x.textAlign = "center"; x.fillStyle = o.c1;
  x.font = "700 26px Inter"; x.fillText("JUZ40 CURATOR HUB", W / 2, 190);
  x.font = "800 92px Montserrat"; x.fillText("СЕРТИФИКАТ", W / 2, 310);
  x.fillStyle = o.c2; x.fillRect(W / 2 - 90, 340, 180, 5);
  x.fillStyle = "#3a3f52"; x.font = "600 34px Inter"; x.fillText("«" + o.title + "»", W / 2, 420);
  x.font = "400 26px Inter"; x.fillStyle = "#6b6f80"; x.fillText("осы сертификат беріледі", W / 2, 480);
  let fs = 74; x.font = `800 ${fs}px Montserrat`; while (x.measureText(o.name || "").width > W - 360 && fs > 36) { fs -= 4; x.font = `800 ${fs}px Montserrat`; }
  x.fillStyle = o.c1; x.fillText(o.name || "Аты-жөні", W / 2, 590);
  x.strokeStyle = o.c2; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 380, 625); x.lineTo(W / 2 + 380, 625); x.stroke();
  x.fillStyle = "#3a3f52"; x.font = "500 30px Inter";
  wrap(x, o.sub || "", W / 2, 690, W - 420, 42);
  x.font = "600 24px Inter"; x.fillStyle = "#3a3f52"; x.textAlign = "left";
  x.fillText("Күні: " + (o.date ? fmtDate(o.date) + " ж." : ""), 200, H - 190);
  x.textAlign = "right"; x.fillText(o.by || "", W - 200, H - 190);
  x.strokeStyle = "#b9b2a0"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(W - 520, H - 215); x.lineTo(W - 200, H - 215); x.stroke();
  x.textAlign = "center"; x.font = "500 18px Inter"; x.fillStyle = "#8a8e9d"; x.fillText("Білім. Құндылық. Байланыс. Нәтиже.", W / 2, H - 140);
  x.beginPath(); x.arc(W / 2, H - 230, 62, 0, 7); x.fillStyle = o.c2; x.fill(); x.beginPath(); x.arc(W / 2, H - 230, 50, 0, 7); x.strokeStyle = "#fff"; x.lineWidth = 2; x.stroke();
  x.fillStyle = "#fff"; x.font = "800 34px Montserrat"; x.fillText("J40", W / 2, H - 218);
}
function wrap(x, t, cx, y, mw, lh) { const w = t.split(" "); let line = ""; for (const s of w) { const tt = line ? line + " " + s : s; if (x.measureText(tt).width > mw && line) { x.fillText(line, cx, y); line = s; y += lh; } else line = tt; } if (line) x.fillText(line, cx, y); }
function certOpts() { const types = certTypes(), ct = types.find(t => t.k === S.ui.certType) || types[0]; return { title: ct.t, sub: draft("cert:sub", ct.sub), name: draft("cert:name", ""), date: draft("cert:date", todayISO()), by: draft("cert:by", S.myName || "JUZ40 Curator Hub"), c1: ct.c1, c2: ct.c2 }; }
async function certFile(o, fmt) {
  const cv = document.createElement("canvas"); cv.width = 1600; cv.height = 1130; await drawCert(cv, o);
  const fn = `JUZ40-сертификат-${(o.name || "").replace(/\s+/g, "-") || "үлгі"}.${fmt}`;
  if (fmt === "png") { const blob = await new Promise(r => cv.toBlob(r, "image/png")); return { filename: fn, data: blob }; }
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "px", format: [1600, 1130], hotfixes: ["px_scaling"] });
  pdf.addImage(cv.toDataURL("image/jpeg", .95), "JPEG", 0, 0, 1600, 1130);
  return { filename: fn, data: pdf.output("blob") };
}
async function saveFile(f) {
  if (!S.downloads) { toast("Жүктеу қолжетімсіз"); return; }
  try { await S.downloads.save(f); toast("Сақталды ✓"); } catch (e) { if (e && e.code !== "declined") toast("Жүктеу мүмкін болмады"); }
}

/* M08 кітапхана */
function allBooks() {
  const up = S.items.filter(i => i.type === "book" && (i.published !== false || isAdm())).map(i => ({ id: i.id, t: i.title, cat: i.cat || "PDF кітап", desc: i.desc || "", pdf: true, url: i.url, assetId: i.assetId, allowDl: i.allowDl, hidden: i.published === false, c: "#1a2a57", a: "#e3bd6c", motif: "book" }));
  return [...D.books, ...up];
}
function bookCard(b) {
  const pg = S.p.books[b.id] || 0, total = b.pdf ? (S.p.books[b.id + ":n"] || 0) : 18, pct = b.pdf ? (total ? Math.round((pg + 1) / total * 100) : 0) : Math.round(Math.min(pg + 1, 18) / 18 * 100) * (S.p.books[b.id] != null ? 1 : 0);
  return `<a class="card modcard" href="#book-${b.id}" style="padding:14px">
    <div class="cover">${art(b.c, b.a, b.motif, 300, 400, b.id.charCodeAt(b.id.length - 1) * 7 + 3)}<div style="position:absolute;inset:auto 0 0 0;padding:16px;background:linear-gradient(transparent,rgba(5,10,25,.85));color:#fff"><div class="tiny" style="color:${b.a};font-weight:700;letter-spacing:.1em">${esc(b.cat.toUpperCase())}</div><div class="disp" style="font-weight:800;font-size:18px">${esc(b.t)}</div></div>${b.hidden ? '<span class="tag bad" style="position:absolute;top:10px;left:10px">Жасырын</span>' : ""}${b.pdf ? '<span class="tag gold" style="position:absolute;top:10px;right:10px">PDF</span>' : ""}</div>
    <span class="small muted">${esc(b.desc)}</span>
    <div class="bar"><i style="width:${pct}%"></i></div><span class="tiny muted">${pct ? pct + "% оқылды" : "Әлі басталмаған"}${b.pdf ? "" : " · 18 бет"}</span></a>`;
}
MR.m08 = () => {
  const books = allBooks(), cats = ["Барлығы", ...new Set(books.map(b => b.cat))];
  const list = books.filter(b => S.ui.libCat === "Барлығы" || b.cat === S.ui.libCat);
  return `<p class="muted">Әр кітап 18 беттен тұрады: кіріспе, теория, мысалдар, әдістер, кейстер, тапсырмалар, тест, рефлексия және қорытынды.</p>${chips(cats, S.ui.libCat, "libCat")}<div class="grid g3">${list.map(bookCard).join("")}</div>`;
};
function bookPages(b) {
  const P = [];
  P.push({ k: "cover" }); P.push({ k: "intro" });
  b.theory.forEach((x, i) => P.push({ k: "th", x, i })); b.examples.forEach((x, i) => P.push({ k: "ex", x, i })); b.methods.forEach((x, i) => P.push({ k: "me", x, i }));
  b.cases.forEach((x, i) => P.push({ k: "case", x, i })); b.tasks.forEach((x, i) => P.push({ k: "task", x, i }));
  P.push({ k: "quiz" }); P.push({ k: "refl" }); P.push({ k: "concl" });
  return P;
}
function vBook(id) {
  const b = allBooks().find(x => x.id === id);
  if (!b) return `<div class="empty">Кітап табылмады. <a href="#m08">Кітапханаға оралу</a></div>`;
  if (b.pdf) return vPdfBook(b);
  const P = bookPages(b), i = Math.max(0, Math.min(P.length - 1, S.ui.bookPage[id] != null ? S.ui.bookPage[id] : Math.min(S.p.books[id] || 0, 17))), pg = P[i];
  S.ui.bookPage[id] = i;
  const seen = S.p.books[id] || 0, sec = { th: "ТЕОРИЯ", ex: "МЫСАЛ", me: "ПРАКТИКАЛЫҚ ӘДІС", case: "ЖАҒДАЯТТЫҚ КЕЙС", task: "ТАПСЫРМА" };
  const ill = (seed) => `<div class="illus">${art(b.c, b.a, b.motif, 800, 150, seed)}</div>`;
  let h = "";
  if (pg.k === "cover") h = `<div class="cover" style="aspect-ratio:auto;height:300px;margin:-44px -52px 26px">${art(b.c, b.a, b.motif, 860, 300, 11)}</div><div class="tiny" style="color:${b.a};font-weight:800;letter-spacing:.14em">GEMINI STORYBOOK · ${esc(b.cat.toUpperCase())}</div><h1 style="font-size:34px">${esc(b.t)}</h1><p class="lead muted">${esc(b.desc)}</p><p class="small muted">JUZ40 CURATOR HUB · 18 бет</p>`;
  else if (pg.k === "intro") h = `${ill(21)}<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">КІРІСПЕ</div><h2>Бұл кітап не туралы?</h2><p class="lead">${esc(b.intro)}</p>`;
  else if (sec[pg.k] && pg.k !== "case" && pg.k !== "task") h = `${ill(31 + i)}<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">${sec[pg.k]} ${pg.i + 1}</div><h2>${esc(pg.x.h)}</h2><p class="lead">${esc(pg.x.p)}</p>`;
  else if (pg.k === "case") h = `<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">ЖАҒДАЯТТЫҚ КЕЙС ${pg.i + 1}</div><h2>Жағдай</h2><div class="tpl lead">${esc(pg.x.s)}</div><h3 class="mt">${esc(pg.x.q)}</h3>${reflBox(`book:${b.id}:case${pg.i}`, "Сіздің шешіміңіз")}<details class="item mt"><summary>Ұсынылатын шешімді көру</summary><p>${esc(pg.x.a)}</p></details>`;
  else if (pg.k === "task") h = `${ill(51 + i)}<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">ТАПСЫРМА</div><h2>${esc(pg.x.h)}</h2><p class="lead">${esc(pg.x.p)}</p>${reflBox(`book:${b.id}:task${pg.i}`, "Орындау нәтижесі")}`;
  else if (pg.k === "quiz") h = `<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">ТЕСТ</div><h2>Өзіңізді тексеріңіз</h2>${quizBlock("book-" + b.id, b.quiz)}`;
  else if (pg.k === "refl") h = `<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">РЕФЛЕКСИЯ</div><h2>Ойлану уақыты</h2>${b.reflection.map((q, j) => reflBox(`book:${b.id}:r${j}`, q)).join("")}`;
  else if (pg.k === "concl") h = `${ill(77)}<div class="tiny muted" style="font-weight:700;letter-spacing:.12em">ҚОРЫТЫНДЫ</div><h2>Негізгі ой</h2><p class="lead">${esc(b.concl)}</p><div class="row mt">${seen >= 17 ? `<span class="tag ok">Кітап оқылды ✓</span>` : ""}<a class="btn" href="#m08">Кітапханаға оралу</a></div>`;
  return `<div class="row between mb"><a href="#m08" class="small muted" style="text-decoration:none">← Кітапхана</a>${favBtn("book:" + b.id)}</div>
  <div class="reader"><div class="page">${h}<span class="pn">${i + 1} / ${P.length}</span></div>
  <div class="readbar"><button class="btn sm" data-a="bp" data-id="${b.id}" data-d="-1" ${i === 0 ? "disabled" : ""}>${icon("left", 15)}Алдыңғы</button>
  <div class="dots">${P.map((_, j) => `<i class="${j === i ? "on" : j <= seen ? "seen" : ""}" data-a="bpGo" data-id="${b.id}" data-p="${j}"></i>`).join("")}</div>
  <button class="btn sm pri" data-a="bp" data-id="${b.id}" data-d="1" ${i === P.length - 1 ? "disabled" : ""}>Келесі${icon("right", 15)}</button></div></div>`;
}
function vPdfBook(b) {
  const i = S.ui.bookPage[b.id] || 0;
  return `<div class="row between mb"><a href="#m08" class="small muted" style="text-decoration:none">← Кітапхана</a><div class="row">${b.allowDl && b.url ? `<a class="btn sm" href="${esc(b.url)}" target="_blank" rel="noopener">${icon("down", 15)}Жүктеу</a>` : ""}${favBtn("item:" + b.id)}</div></div>
  <h1>${esc(b.t)}</h1><p class="muted">${esc(b.desc)}</p>
  <div class="reader"><div class="pdfwrap" id="pdfwrap"><span style="color:#ccc" class="small"><span class="spin"></span> PDF жүктелуде...</span></div>
  <div class="readbar"><button class="btn sm" data-a="pdfp" data-id="${b.id}" data-d="-1">${icon("left", 15)}Алдыңғы</button><span class="small" id="pdfpn">${i + 1}</span><button class="btn sm pri" data-a="pdfp" data-id="${b.id}" data-d="1">Келесі${icon("right", 15)}</button></div></div>`;
}
const pdfCache = {};
async function renderPdf(b) {
  const wrapEl = $("#pdfwrap"); if (!wrapEl) return;
  try {
    if (!window.pdfjsLib) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    }
    const src = b.url || ("/_blob/" + b.assetId);
    if (!pdfCache[b.id]) pdfCache[b.id] = await window.pdfjsLib.getDocument({ url: src }).promise;
    const doc = pdfCache[b.id], n = doc.numPages;
    let i = Math.max(0, Math.min(n - 1, S.ui.bookPage[b.id] || 0)); S.ui.bookPage[b.id] = i;
    if (S.p.books[b.id + ":n"] !== n || (S.p.books[b.id] || 0) < i) { S.p.books[b.id + ":n"] = n; S.p.books[b.id] = Math.max(S.p.books[b.id] || 0, i); if (i >= n - 1) S.p.books[b.id] = Math.max(i, 17); saveP(); }
    const page = await doc.getPage(i + 1), vp = page.getViewport({ scale: 1.6 });
    const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    const w = $("#pdfwrap"); if (!w) return; w.innerHTML = ""; w.appendChild(cv);
    const pn = $("#pdfpn"); if (pn) pn.textContent = `${i + 1} / ${n}`;
  } catch (e) { console.error(e); wrapEl.innerHTML = `<span style="color:#ddd" class="small">PDF ашылмады. ${b.url ? `<a style="color:#e3bd6c" href="${esc(b.url)}" target="_blank" rel="noopener">Жаңа терезеде ашу</a>` : ""}</span>`; }
}

/* ---------- QUIZ BLOCK ---------- */
function quizBlock(qid, qs) {
  const sel = S.ui.quizSel[qid] || {}, res = S.ui.quizRes[qid];
  const prev = S.p.quiz[qid];
  return `<div>${qs.map((q, i) => `<div class="mt" style="margin-top:14px"><b>${i + 1}. ${esc(q.q)}</b>${q.o.map((o, j) => {
    let cls = ""; if (res) { if (j === q.a) cls = "right"; else if (sel[i] === j) cls = "wrong"; } else if (sel[i] === j) cls = "right";
    return `<div class="opt ${res ? cls : ""}" style="${!res && sel[i] === j ? "border-color:var(--ink);background:#f2f4fa" : ""}" ${res ? "" : `data-a="qsel" data-q="${qid}" data-i="${i}" data-j="${j}"`}><span>${String.fromCharCode(65 + j)}.</span><span>${esc(o)}</span></div>`;
  }).join("")}</div>`).join("")}
  <div class="row mt">${res ? `<span class="tag ${res >= 70 ? "ok" : "bad"}" style="font-size:14px;padding:6px 12px">Нәтиже: ${res}%</span><button class="btn sm" data-a="qreset" data-q="${qid}">Қайта тапсыру</button>` : `<button class="btn pri" data-a="qcheck" data-q="${qid}">Тексеру</button>`}${prev != null && !res ? `<span class="small muted">Алдыңғы нәтиже: ${prev}%</span>` : ""}</div></div>`;
}
function quizById(qid) {
  if (qid.startsWith("book-")) { const b = D.books.find(x => "book-" + x.id === qid); return b && b.quiz; }
  const q = D.quizzes.find(x => x.id === qid); if (q) return q.qs;
  const it = S.items.find(x => x.id === qid); return it && it.qs;
}

/* M09 академия */
MR.m09 = () => {
  const t = S.ui.acadTab;
  const tabs = [["quiz", "Тесттер"], ["sit", "Жағдаяттық тапсырмалар"], ["rp", "Рөлдік ойын"], ["task", "Практикалық тапсырмалар"], ["refl", "Рефлексия"]];
  let h = "";
  if (t === "quiz") {
    const qs = [...D.quizzes, ...S.items.filter(i => i.type === "quiz" && (i.published !== false || isAdm())).map(i => ({ id: i.id, t: i.title, d: i.desc, qs: i.qs || [] }))];
    h = `<div class="list">${qs.map(q => `<details class="item"><summary><span>${esc(q.t)} <span class="tag">${q.qs.length} сұрақ</span> ${S.p.quiz[q.id] != null ? `<span class="tag ${S.p.quiz[q.id] >= 70 ? "ok" : "bad"}">${S.p.quiz[q.id]}%</span>` : ""}</span></summary><p class="small muted">${esc(q.d || "")}</p>${quizBlock(q.id, q.qs)}</details>`).join("")}</div>`;
  } else if (t === "sit") {
    const total = D.situations.length * 3, got = D.situations.reduce((a, s, i) => a + (S.ui.sitSel[i] != null ? s.o[S.ui.sitSel[i]].p : 0), 0), answered = Object.keys(S.ui.sitSel).length;
    h = `<p class="muted">Әр жағдайда ең кәсіби әрекетті таңдаңыз. Әр жауап 0–3 баллмен бағаланады.</p><div class="list">${D.situations.map((s, i) => `<div class="item"><b>${i + 1}. ${esc(s.s)}</b>${s.o.map((o, j) => { const ch = S.ui.sitSel[i]; const cls = ch == null ? "" : j === ch ? (o.p === 3 ? "right" : "wrong") : (o.p === 3 ? "right" : ""); return `<div class="opt ${cls}" ${ch == null ? `data-a="sit" data-i="${i}" data-j="${j}"` : ""}><span>${String.fromCharCode(65 + j)}.</span><span>${esc(o.t)}${ch != null ? ` <span class="tag">${o.p} балл</span>` : ""}</span></div>`; }).join("")}</div>`).join("")}</div>
    <div class="card mt row between"><b>Жиынтық: ${got}/${total} балл (${answered}/${D.situations.length} жауап)</b>${answered === D.situations.length ? `<span class="tag ${got / total >= .7 ? "ok" : "bad"}">${Math.round(got / total * 100)}%</span>` : ""}<button class="btn sm" data-a="sitReset">Қайта бастау</button></div>`;
  } else if (t === "rp") {
    if (!aiOn()) h = `<div class="empty">Рөлдік ойын үшін AI қолжетімді болуы керек.</div>`;
    else if (!S.ui.rp) h = `<p class="muted">AI кейіпкер рөлін ойнайды, ал сіз куратор ретінде сөйлесесіз. Соңында AI әңгімеңізді бағалап, кері байланыс береді.</p><div class="grid g3">${D.roleplays.map(r => `<div class="card"><span class="tag gold">${esc(r.who)}</span><h3 class="mt" style="margin-top:8px">${esc(r.t)}</h3><button class="btn pri" data-a="rpStart" data-id="${r.id}">Бастау</button></div>`).join("")}</div>`;
    else { const r = D.roleplays.find(x => x.id === S.ui.rp);
      h = `<div class="card"><div class="row between"><div><span class="tag gold">${esc(r.who)}</span> <b>${esc(r.t)}</b></div><div class="row"><button class="btn sm" data-a="rpEval" ${S.ui.busy.rp ? "disabled" : ""}>Бағалау</button><button class="btn sm ghost" data-a="rpStop">Аяқтау</button></div></div>
      <div class="chat mt" style="height:min(60vh,520px)"><div class="chatlog" id="rplog">${S.ui.rpLog.map(m => `<div class="bub ${m.role === "assistant" ? "s" : "c"}" style="${m.role === "assistant" ? "align-self:flex-start" : "align-self:flex-end"}"><span class="who">${m.role === "assistant" ? esc(r.who) : "Сіз (куратор)"}</span>${esc(m.content)}</div>`).join("")}${S.ui.busy.rp ? `<div class="small muted"><span class="spin"></span> жауап жазуда...</div>` : ""}</div>
      <div class="chatin"><textarea class="in" data-draft="rp:in" placeholder="Куратор ретінде жауап жазыңыз...">${esc(draft("rp:in"))}</textarea><button class="btn pri" data-a="rpSend" ${S.ui.busy.rp ? "disabled" : ""}>${icon("send", 16)}</button></div></div>
      ${S.ui.rpEval ? `<h3 class="mt">AI кері байланысы</h3><div class="aiout">${esc(S.ui.rpEval)}</div>` : ""}</div>`; }
  } else if (t === "task") {
    const tasks = S.items.filter(i => i.type === "task" && (i.published !== false || isAdm()));
    const builtin = [{ id: "bt1", title: "Апталық байланыс аудиті", body: "Осы аптада жазған 10 хабарламаңызды талдаңыз: қаншасы жылы, қаншасы суық? Үшеуін СКС формуласымен қайта жазып, осында қойыңыз." },
      { id: "bt2", title: "Ата-анаға апталық есеп", body: "Бір оқушыңыз үшін 04-модульдегі құрылым бойынша апталық есеп жазыңыз (аты-жөнін өзгертіп)." },
      { id: "bt3", title: "Ойын сценарийі", body: "05-модульдегі бір ойынды өз тобыңызға бейімдеп, толық сценарий жазыңыз: мақсат, уақыт, сөздер, сұрақтар." }];
    h = `<div class="list">${[...builtin, ...tasks].map(taskCard).join("")}</div>`;
  } else if (t === "refl") {
    h = `<p class="muted">Апталық кәсіби рефлексия — жеке дамудың ең қарапайым құралы.</p>${["Осы аптада не жақсы болды?", "Не қиын болды және неліктен?", "Қай оқушыға ерекше назар керек?", "Келесі аптада нені өзгертемін?"].map((q, i) => reflBox(`week:${weekKey()}:${i}`, q)).join("")}`;
  }
  return `<div class="tabs">${tabs.map(([k, l]) => `<button class="chip ${t === k ? "on" : ""}" data-a="acad" data-t="${k}">${l}</button>`).join("")}</div>${h}`;
};
function weekKey() { const d = new Date(), j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + "w" + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }

/* M10 профиль */
MR.m10 = () => {
  const p = S.p, pr = p.profile || {};
  const mods = visibleMods(), done = mods.filter(m => p.done[m.id]);
  const certs = S.items.filter(i => i.type === "cert" && i.recipientId === S.uid);
  const quizzes = Object.entries(p.quiz);
  const allQ = [["situations", "Жағдаяттық тапсырмалар"], ...D.quizzes.map(q => [q.id, q.t]), ...D.books.map(b => ["book-" + b.id, "Кітап тесті: " + b.t]), ...S.items.filter(i => i.type === "quiz").map(i => [i.id, i.title])];
  const qName = id => (allQ.find(x => x[0] === id) || [0, id])[1];
  return `<div class="grid g2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.6fr)">
  <div class="card"><div class="row"><div class="modicon" style="width:64px;height:64px;border-radius:50%;font-size:22px;font-weight:800;font-family:Montserrat">${esc((S.myName || "К").slice(0, 1))}</div><div><h2 style="margin:0">${esc(S.myName || "Куратор")}</h2><span class="tag gold">${isAdm() ? "Әкімші" : "Куратор"}</span></div></div>
    ${[["group", "Топ / бағыт"], ["city", "Қала"], ["exp", "Тәжірибе (жыл)"], ["goal", "Кәсіби мақсатым"]].map(([k, l]) => `<label class="lb">${l}</label><input class="in" data-prof="${k}" value="${esc(pr[k] || "")}">`).join("")}
    <label class="lb">Өзім туралы</label><textarea class="in" data-prof="about">${esc(pr.about || "")}</textarea><p class="tiny muted">Өзгерістер автоматты сақталады.</p></div>
  <div>
    <div class="grid g4 keep2">${[["Модульдер", `${done.length}/${mods.length}`], ["XP", xpOf(p, S.uid)], ["Челлендж", `${Object.keys(p.ch).length}/30`], ["Кейстер", Object.keys(p.cases).length]].map(([l, v]) => `<div class="card"><div class="stat">${v}</div><div class="small muted">${l}</div></div>`).join("")}</div>
    <div class="card mt"><h3>Аяқталған модульдер</h3>${done.length ? `<div class="row">${done.map(m => `<a class="tag ok" href="#${m.id}" style="text-decoration:none">${m.n}. ${esc(m.title)}</a>`).join("")}</div>` : `<p class="small muted">Әлі аяқталған модуль жоқ.</p>`}
    <div class="bar mt"><i style="width:${mods.length ? done.length / mods.length * 100 : 0}%"></i></div></div>
    <div class="card mt"><h3>Тест нәтижелері</h3>${quizzes.length ? quizzes.map(([id, v]) => `<div class="hbar"><span>${esc(qName(id))}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}%</b></div>`).join("") : `<p class="small muted">Тест тапсырылмаған.</p>`}</div>
    <div class="card mt"><h3>Челлендж прогресі</h3><div class="bar"><i style="width:${Object.keys(p.ch).length / 30 * 100}%"></i></div><p class="small muted mt" style="margin-top:6px">${Object.keys(p.ch).length} күн орындалды${p.chStart ? " · басталған күні " + fmtDate(p.chStart) : ""}</p></div>
    <div class="card mt"><h3>Сертификаттар</h3>${certs.length ? `<div class="row">${certs.map(c => `<span class="tag gold">${icon("award", 13)} ${esc(c.title)} · ${fmtDate(c.date || c.at)}</span>`).join("")}</div>` : `<p class="small muted">Әзірге сертификат жоқ.</p>`}</div>
    <div class="card mt"><h3>Жеке даму статистикасы</h3><div class="kv"><b>Оқылған кітаптар</b><span>${finishedBooks(p)} / ${allBooks().length}</span><b>Рефлексиялар</b><span>${Object.keys(p.refl).length}</span><b>Таңдаулылар</b><span>${p.favs.length}</span><b>Тапсырмалар</b><span>${Object.keys(p.tasks).length}</span><b>Соңғы белсенділік</b><span>${fmtDate(p.lastActive)}</span></div></div>
  </div></div>
  <div class="sectionhead"><h2>Жетістіктер</h2></div><div class="grid g4 keep2">${D.achievements.map(achCard).join("")}</div>`;
};

/* M11 Case Battle */
function allCases() { return [...D.cases, ...S.items.filter(i => i.type === "case" && (i.published !== false || isAdm())).map(i => ({ id: i.id, lvl: i.lvl || "Орташа", t: i.title, s: i.s || i.body, task: i.task || "", custom: true }))]; }
MR.m11 = () => {
  const cs = allCases(), open = cs.find(c => c.id === S.ui.openCase);
  const my = S.scores[S.uid] || {};
  if (open) {
    const a = S.p.cases[open.id], ai = a && a.ai;
    return `<button class="btn sm" data-a="caseOpen" data-id="">${icon("left", 15)}Барлық кейстер</button>
    <div class="card mt"><div class="row"><span class="tag ${open.lvl === "Қиын" ? "bad" : open.lvl === "Жеңіл" ? "ok" : "gold"}">${esc(open.lvl)}</span>${my[open.id] != null ? `<span class="tag gold">Әкімші бағасы: ${my[open.id]}</span>` : ""}</div><h2 class="mt" style="margin-top:10px">${esc(open.t)}</h2>
    <h4>Жағдай</h4><div class="tpl">${esc(open.s)}</div><h4 class="mt">Тапсырма</h4><p>${esc(open.task)}</p>
    <label class="lb">Сіздің шешіміңіз</label><textarea class="in" style="min-height:180px" data-draft="case:${open.id}" placeholder="Нақты қадамдар, хабарлама мәтіндері, уақыт...">${esc(draft("case:" + open.id, a ? a.text : ""))}</textarea>
    <div class="row mt"><button class="btn pri" data-a="caseSubmit" data-id="${open.id}">${a ? "Жаңарту" : "Жіберу"}</button>${aiOn() ? `<button class="btn" data-a="caseAI" data-id="${open.id}" ${S.ui.busy.case ? "disabled" : ""}>${S.ui.busy.case ? '<span class="spin"></span>' : icon("bot", 16)}AI бағалауы</button>` : ""}${a ? `<span class="tiny muted">Жіберілді: ${fmtDate(a.at)}</span>` : ""}</div>
    ${ai ? `<div class="card mt" style="background:#fbf9f4"><div class="row between"><h3 style="margin:0">AI бағасы</h3><span class="stat">${ai.score}/100</span></div>${ai.strengths && ai.strengths.length ? `<h4 class="mt">Күшті жақтары</h4><ul>${ai.strengths.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}${ai.improve && ai.improve.length ? `<h4>Жақсартуға болатын тұстар</h4><ul>${ai.improve.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}${ai.tip ? `<p><b>Кеңес:</b> ${esc(ai.tip)}</p>` : ""}</div>` : ""}</div>`;
  }
  return `<p class="muted">Нақты кураторлық жағдайларды шешіп, ұпай жинаңыз. Әр шешім — 30 XP, әкімші бағасы қосымша ұпай береді.</p>
  <div class="grid g3">${cs.map(c => { const a = S.p.cases[c.id]; return `<div class="card modcard" data-a="caseOpen" data-id="${c.id}" style="cursor:pointer"><div class="row between"><span class="tag ${c.lvl === "Қиын" ? "bad" : c.lvl === "Жеңіл" ? "ok" : "gold"}">${esc(c.lvl)}</span>${a ? `<span class="tag ok">${icon("check", 12)} Шешілді${a.ai ? " · AI " + a.ai.score : ""}</span>` : ""}</div><h3 style="margin:6px 0 0">${esc(c.t)}</h3><span class="small muted">${esc(c.s.slice(0, 120))}…</span></div>`; }).join("")}</div>
  <div class="sectionhead"><h2>Рейтинг</h2></div>${leaderboard("cases")}`;
};
function leaderboard(by) {
  if (!S.db) return `<div class="empty small">Рейтинг деректер қорына қосылғанда көрінеді.</div>`;
  const rows = [...S.board].sort((a, b) => (by === "cases" ? (b.cases - a.cases) || (b.xp - a.xp) : b.xp - a.xp)).slice(0, 15);
  if (!rows.length) return `<div class="empty small">Әзірге ешкім жоқ — бірінші болыңыз!</div>`;
  return `<div class="card"><table class="t"><tr><th>#</th><th>Куратор</th><th>XP</th><th>Модуль</th><th>Кейс</th><th>Челлендж</th></tr>${rows.map((r, i) => `<tr ${r.id === S.uid ? 'style="background:var(--goldsoft)"' : ""}><td><b>${i + 1}</b>${i < 3 ? " " + ["🥇", "🥈", "🥉"][i] : ""}</td><td>${esc(S.names[r.id] || "Куратор")}${r.id === S.uid ? " (сіз)" : ""}</td><td><b>${r.xp || 0}</b></td><td>${r.mods || 0}</td><td>${r.cases || 0}</td><td>${r.ch || 0}</td></tr>`).join("")}</table></div>`;
}

/* M12 челлендж */
function chList() { const c = S.cfg.challenge || {}; return (c.tasks && c.tasks.length === 30) ? c.tasks : D.challenge; }
function chCurrentDay() { if (!S.p.chStart) return 1; return Math.max(1, Math.min(30, Math.floor((new Date(todayISO()) - new Date(S.p.chStart)) / 864e5) + 1)); }
MR.m12 = () => {
  const L = chList(), cur = chCurrentDay(), n = Object.keys(S.p.ch).length, c = S.cfg.challenge || {};
  if (c.active === false && !isAdm()) return `<div class="empty">Челлендж әзірге белсенді емес. Әкімші жариялағанда қолжетімді болады.</div>`;
  return `<div class="card mb row between"><div><h3 style="margin:0">${esc(c.title || "30 күндік кураторлық челлендж")}</h3><p class="small muted" style="margin:4px 0 0">${esc(c.desc || "Күн сайын бір кәсіби қадам. 30 күнде — жаңа әдеттер.")}</p></div>
  ${S.p.chStart ? `<div class="row"><span class="stat">${n}/30</span><button class="btn sm ghost" data-a="chReset">Қайта бастау</button></div>` : `<button class="btn pri" data-a="chStart">Бүгін бастау</button>`}</div>
  <div class="bar mb"><i style="width:${n / 30 * 100}%"></i></div>
  <div class="daygrid">${L.map((t, i) => { const d = i + 1, done = !!S.p.ch[d], locked = !S.p.chStart || d > cur; return `<button class="day ${done ? "done" : ""} ${d === cur && S.p.chStart ? "today" : ""} ${locked && !done ? "locked" : ""}" ${locked ? "" : `data-a="chToggle" data-d="${d}"`}><span class="row between"><span class="dn">${d}-КҮН</span>${done ? icon("check", 15) : ""}</span><span>${esc(t)}</span></button>`; }).join("")}</div>`;
};

/* M13 AI ментор */
const SYS = () => `Сен — «JUZ40 CURATOR HUB» платформасының AI Менторысың. JUZ40 білім беру орталығының кураторларына кәсіби кеңес бересің. Философия: «Білім. Құндылық. Байланыс. Нәтиже». Ұран: «Кураторлық – жай міндет емес, адамға әсер ету өнері». Әрқашан кәсіби, жылы, әдеби қазақ тілінде жауап бер. Жауаптарың нақты, практикалық болсын: қадамдар, дайын хабарлама үлгілері, мысалдар. Ұзақ кіріспесіз, қысқа тақырыпшалар мен тізімдер қолдан. Оқушылардың жеке деректерін сұрама. Психологиялық дағдарыс немесе қауіпсіздік қатері белгілері болса, басшылыққа және мамандарға жүгінуді ұсын.${cfgAI().extra ? "\nӘкімшінің қосымша нұсқаулары: " + cfgAI().extra : ""}`;
MR.m13 = () => {
  if (!aiOn()) return `<div class="empty">AI Ментор бұл көріністе қолжетімсіз.</div>`;
  const sug = ["Белсенді емес оқушыны қалай қайтарамын?", "Ашулы ата-анаға қалай жауап беремін?", "LIVE-та белсенділікті арттыру идеялары", "Кәсіби шаршаудан қалай сақтанамын?"];
  return `<div class="card"><div class="chat"><div class="chatlog" id="chatlog">
    ${S.ui.chat.length ? S.ui.chat.map(m => `<div class="bub ${m.role === "user" ? "c" : "s"}" style="${m.role === "user" ? "align-self:flex-end" : "align-self:flex-start"}"><span class="who">${m.role === "user" ? "Сіз" : "AI Ментор"}</span>${esc(m.content)}</div>`).join("") : `<div class="empty"><div class="modicon" style="margin:0 auto 10px">${icon("bot")}</div><b>Сәлеметсіз бе! Мен — сіздің AI Менторыңызбын.</b><p class="small">Оқушылармен, ата-аналармен, топпен жұмыс туралы кез келген сұрақ қойыңыз.</p><div class="row" style="justify-content:center">${sug.map(s => `<button class="chip" data-a="chatSug" data-t="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`}
    ${S.ui.busy.chat && !(S.ui.chat[S.ui.chat.length - 1] || {}).content ? `<div class="small muted"><span class="spin"></span> ойлануда...</div>` : ""}</div>
    <div class="chatin"><textarea class="in" data-draft="chat:in" placeholder="Сұрағыңызды жазыңыз...">${esc(draft("chat:in"))}</textarea><button class="btn pri" data-a="chatSend" ${S.ui.busy.chat ? "disabled" : ""}>${icon("send", 16)}</button></div>
    ${S.ui.chat.length ? `<div class="row mt" style="margin-top:8px"><button class="btn sm ghost" data-a="chatClear">Жаңа әңгіме</button></div>` : ""}</div></div>`;
};

/* M14 AI генератор */
const GEN_KINDS = [["mot", "Мотивациялық хабарлама (оқушыға/топқа)"], ["par", "Ата-анаға хабарлама"], ["stu", "Оқушыға жеке хабарлама"], ["ann", "Топтық хабарландыру"], ["live", "LIVE / кездесу сценарийі"], ["fb", "Кері байланыс (ФӘҰ)"]];
MR.m14 = () => {
  if (!aiOn()) return `<div class="empty">AI генератор бұл көріністе қолжетімсіз.</div>`;
  const k = draft("gen:kind", "mot");
  return `<div class="grid g2"><div class="card"><h3>Не жазамыз?</h3>
    <label class="lb">Мәтін түрі</label><select class="in" data-draft="gen:kind">${GEN_KINDS.map(([v, l]) => `<option value="${v}" ${v === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <label class="lb">Кімге (міндетті емес)</label><input class="in" data-draft="gen:to" value="${esc(draft("gen:to"))}" placeholder="Мысалы: Айбек, 11-сынып / Айбектің анасы">
    <label class="lb">Жағдай</label><textarea class="in" data-draft="gen:sit" placeholder="Мысалы: соңғы тестте 15 баллға өсті, бірақ тапсырмаларды кешіктіреді">${esc(draft("gen:sit"))}</textarea>
    <div class="grid g2"><div><label class="lb">Тон</label><select class="in" data-draft="gen:tone">${["Жылы", "Ресми", "Қуатты", "Қысқа әрі нақты", "Әзілді"].map(t => `<option ${t === draft("gen:tone", "Жылы") ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div><label class="lb">Нұсқа саны</label><select class="in" data-draft="gen:n">${["1", "2", "3"].map(t => `<option ${t === draft("gen:n", "2") ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
    <button class="btn pri mt" data-a="gen" ${S.ui.busy.gen ? "disabled" : ""}>${S.ui.busy.gen ? '<span class="spin"></span> Жазылуда...' : icon("wand", 16) + "Жасау"}</button></div>
  <div class="card"><div class="row between"><h3 style="margin:0">Нәтиже</h3>${S.ui.gen ? copyBtn(S.ui.gen) : ""}</div><div class="aiout mt" id="genout">${S.ui.gen ? esc(S.ui.gen) : '<span class="muted small">Мәтін осы жерде пайда болады.</span>'}</div>
  ${S.ui.gen ? `<a class="btn sm mt" href="https://wa.me/?text=${encodeURIComponent(S.ui.gen)}" target="_blank" rel="noopener">${icon("wa", 15)}WhatsApp-та ашу</a>` : ""}</div></div>`;
};

/* M15 */
MR.m15 = () => {
  const b = S.p.burnout, ans = S.ui.burn || {};
  return `<div class="grid g2">${D.ei.map(e => `<div class="card"><h3>${esc(e.t)}</h3><p>${esc(e.p)}</p></div>`).join("")}</div>
  <div class="sectionhead"><h2>Кәсіби күйіп қалу: өзін-өзі тексеру</h2></div>
  <div class="card"><p class="small muted">Соңғы екі аптадағы күйіңізді бағалаңыз: 0 — ешқашан, 4 — үнемі. Нәтиже тек сізге көрінеді.</p>
  ${D.burnout.map((q, i) => `<div class="mt" style="margin-top:12px"><b class="small">${i + 1}. ${esc(q)}</b><div class="likert mt" style="margin-top:6px">${[0, 1, 2, 3, 4].map(v => `<label><input type="radio" name="bo${i}" value="${v}" data-burn="${i}" ${ans[i] === v ? "checked" : ""}><span>${v}</span></label>`).join("")}</div></div>`).join("")}
  <div class="row mt"><button class="btn pri" data-a="burnCheck">Нәтижені көру</button>${b ? `<span class="small muted">Соңғы нәтиже: ${b.score}/32 (${fmtDate(b.at)})</span>` : ""}</div>
  ${b && S.ui.burnShow ? burnResult(b.score) : ""}</div>`;
};
function burnResult(s) {
  const [t, cls, p] = s <= 10 ? ["Төмен деңгей", "ok", "Сіз тепе-теңдікті жақсы сақтап жүрсіз. Қазіргі әдеттеріңізді жалғастырыңыз."] : s <= 20 ? ["Орташа деңгей", "gold", "Шаршау белгілері бар. Жұмыс уақытының шекарасын нақтылап, күніне 3 микро-үзіліс енгізіңіз және әріптеспен сөйлесіңіз."] : ["Жоғары деңгей", "bad", "Сізге демалыс пен қолдау қажет. Басшыңызбен жүктеме туралы сөйлесіңіз, жақын адамдарыңызға айтыңыз; күйіңіз ұзақ сақталса, маманға жүгінуді қарастырыңыз."];
  return `<div class="card mt" style="background:#fbf9f4"><span class="tag ${cls}">${t} · ${s}/32</span><p class="mt" style="margin-top:8px">${p}</p></div>`;
}
/* M16 */
MR.m16 = () => `<div class="grid g2">${D.time.map(e => `<div class="card"><h3>${esc(e.t)}</h3><p>${esc(e.p)}</p></div>`).join("")}</div>
  <div class="sectionhead"><h2>Куратордың үлгі аптасы</h2></div><div class="card"><table class="t">${D.weekPlan.map(([d, t]) => `<tr><td style="width:130px"><b>${d}</b></td><td>${esc(t)}</td></tr>`).join("")}</table></div>
  <div class="sectionhead"><h2>Менің апталық жоспарым</h2><span class="tiny muted">Автоматты сақталады</span></div>
  <div class="grid g4 keep2">${D.weekPlan.map(([d]) => `<div class="card" style="padding:14px"><b class="small">${d}</b><textarea class="in mt" style="margin-top:6px;min-height:110px" data-plan="${d}" placeholder="Басымдықтар...">${esc(S.p.plan[d] || "")}</textarea></div>`).join("")}</div>`;
/* M17 */
MR.m17 = () => {
  const v = k => +draft("kpi:" + k, "") || 0;
  const n = v("n"), att = v("att"), tg = v("tg"), td = v("td"), s1 = v("s1"), s0 = v("s0");
  const r1 = n ? Math.round(att / n * 100) : 0, r2 = tg ? Math.round(td / tg * 100) : 0, dl = s1 - s0;
  const rep = `Топтың апталық есебі\nОқушы саны: ${n}\nҚатысу деңгейі: ${r1}%\nТапсырма орындау: ${r2}%\nОрташа балл: ${s1} (${dl >= 0 ? "+" : ""}${dl})\nҚорытынды: ${r1 >= 85 && r2 >= 80 ? "топ мақсатты көрсеткіштерге жетті." : "көрсеткіштерді арттыру үшін белсенді емес оқушылармен жеке жұмыс жоспарланды."}`;
  return `<div class="card"><table class="t"><tr><th>Көрсеткіш</th><th>Формула</th><th>Мақсат</th></tr>${D.kpi.map(k => `<tr><td><b>${esc(k.k)}</b></td><td>${esc(k.f)}</td><td><span class="tag gold">${esc(k.n)}</span></td></tr>`).join("")}</table></div>
  <div class="sectionhead"><h2>KPI калькуляторы және есеп</h2></div>
  <div class="grid g2"><div class="card"><div class="grid g2">${[["n", "Оқушы саны"], ["att", "Сабақ көргендер"], ["tg", "Берілген тапсырма"], ["td", "Уақытында тапсырылған"], ["s1", "Осы аптадағы орташа балл"], ["s0", "Өткен аптадағы орташа балл"]].map(([k, l]) => `<div><label class="lb">${l}</label><input class="in" type="number" min="0" data-draft="kpi:${k}" data-live="kpi" value="${esc(draft("kpi:" + k))}"></div>`).join("")}</div></div>
  <div class="card" id="kpiout"><div class="grid g3 keep2"><div><div class="stat">${r1}%</div><span class="small muted">Қатысу</span></div><div><div class="stat">${r2}%</div><span class="small muted">Тапсырма</span></div><div><div class="stat" style="color:${dl >= 0 ? "var(--ok)" : "var(--bad)"}">${dl >= 0 ? "+" : ""}${dl}</div><span class="small muted">Балл динамикасы</span></div></div><div class="tpl mt">${esc(rep)}</div><div class="mt" style="margin-top:8px">${copyBtn(rep, "Есепті көшіру")}</div></div></div>`;
};
/* M18 */
MR.m18 = () => {
  const anns = S.items.filter(i => i.type === "announce").sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  const posts = []; S.posts.forEach(d => (d.list || []).forEach(p => posts.push({ ...p, uid: d.id })));
  posts.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  return `<div class="grid g2" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div>
    <h2>Хабарландырулар</h2>${anns.length ? `<div class="list">${anns.map(a => `<div class="item"><div class="row between"><b>${esc(a.title)}</b><span class="tiny muted">${fmtDate(a.at)}</span></div><p class="prose small mt" style="margin-top:6px">${esc(a.body)}</p></div>`).join("")}</div>` : `<div class="empty small">Хабарландыру жоқ.</div>`}
    <div class="sectionhead"><h2>Үздік тәжірибе</h2></div>
    ${S.db && S.canWrite ? `<div class="card mb"><textarea class="in" data-draft="post" placeholder="Әріптестеріңізбен табысты әдісіңізбен бөлісіңіз...">${esc(draft("post"))}</textarea><button class="btn pri mt" style="margin-top:8px" data-a="postAdd">Бөлісу</button></div>` : ""}
    ${posts.length ? `<div class="list">${posts.slice(0, 40).map(p => `<div class="item"><div class="row between"><b class="small">${esc(S.names[p.uid] || "Куратор")}</b><span class="row tiny muted">${fmtDate(p.at)}${p.uid === S.uid || isAdm() ? `<button class="iconbtn" data-a="postDel" data-u="${p.uid}" data-id="${p.id}">${icon("trash", 15)}</button>` : ""}</span></div><p class="prose small" style="margin:6px 0 0">${esc(p.text)}</p></div>`).join("")}</div>` : `<div class="empty small">Әзірге жазба жоқ. Бірінші болып бөлісіңіз!</div>`}
  </div><div><h2>Жалпы рейтинг</h2>${leaderboard("xp")}</div></div>`;
};

/* ---------- FAVORITES & SEARCH ---------- */
function vFav() {
  const list = (S.p.favs || []).map(k => [k, REG[k]]).filter(x => x[1]);
  return `<h1>Таңдаулылар</h1><p class="muted">Жұлдызша белгіленген материалдар осында сақталады.</p>
  ${list.length ? `<div class="list mt">${list.map(([k, r]) => `<div class="item"><div class="row between"><div><span class="tag gold">${esc(r.kind)}</span> <b>${esc(r.t)}</b></div><div class="row">${favBtn(k)}<a class="btn sm" href="#${r.r}">Ашу</a></div></div>${r.body ? `<div class="tpl mt" style="margin-top:8px">${esc(fillT(r.body).slice(0, 400))}${r.body.length > 400 ? "…" : ""}</div><div class="mt" style="margin-top:8px">${copyBtn(fillT(r.body))}</div>` : ""}</div>`).join("")}</div>` : `<div class="empty mt">Әзірге таңдаулы жоқ. Кез келген хабарлама, ойын немесе материалдың жанындағы ☆ белгісін басыңыз.</div>`}`;
}
function vSearch() {
  const q = S.ui.search.trim().toLowerCase();
  const res = Object.entries(REG).filter(([k, r]) => (r.t + " " + r.body).toLowerCase().includes(q)).slice(0, 60);
  return `<h1>Іздеу: «${esc(S.ui.search)}»</h1><p class="muted">${res.length} нәтиже</p><div class="list mt">${res.map(([k, r]) => `<a class="item" href="#${r.r}" style="text-decoration:none;color:inherit;display:block"><span class="tag gold">${esc(r.kind)}</span> <b>${esc(r.t)}</b><p class="small muted" style="margin:6px 0 0">${esc(r.body.slice(0, 180))}${r.body.length > 180 ? "…" : ""}</p></a>`).join("") || `<div class="empty">Ештеңе табылмады</div>`}</div>`;
}

/* ---------- ADMIN ---------- */
function vAdmin() {
  if (!S.isAdmin) return "";
  const t = S.ui.admTab;
  const tabs = [["overview", "Аналитика"], ["users", "Кураторлар"], ["modules", "Модульдер мен сабақтар"], ["library", "Кітапхана (PDF)"], ["materials", "Материалдар"], ["quizzes", "Тесттер"], ["tasks", "Тапсырмалар"], ["cases", "Case Battle"], ["challenge", "Челлендж"], ["certs", "Сертификаттар"], ["ann", "Хабарландырулар"], ["ai", "AI баптаулары"], ["settings", "Платформа"]];
  const body = (AD[t] || AD.overview)();
  return `<div class="row between mb"><div><h1>Әкімшілік кабинеті</h1><p class="muted" style="margin:0">Платформаны толық басқару</p></div>${S.asCurator ? `<span class="tag bad">Куратор көрінісі қосулы</span>` : ""}</div>
  ${!S.db ? `<div class="banner">Деректер қоры қолжетімсіз — басқару функциялары жұмыс істемейді.</div>` : ""}
  <div class="tabs">${tabs.map(([k, l]) => `<button class="chip ${t === k ? "on" : ""}" data-a="adm" data-t="${k}">${l}</button>`).join("")}</div>${body}`;
}
const fld = (id, label, val = "", ph = "", type = "input") => `<label class="lb">${label}</label>${type === "textarea" ? `<textarea class="in" id="${id}" placeholder="${esc(ph)}">${esc(val)}</textarea>` : `<input class="in" id="${id}" value="${esc(val)}" placeholder="${esc(ph)}">`}`;
const val = id => { const e = document.getElementById(id); return e ? (e.type === "checkbox" ? e.checked : e.value.trim()) : ""; };
const modSelect = (id, cur) => `<select class="in" id="${id}">${D.modules.map(m => `<option value="${m.id}" ${m.id === cur ? "selected" : ""}>${m.n}. ${esc(m.title)}</option>`).join("")}</select>`;
const itemRow = (i, extra = "") => `<tr><td><b>${esc(i.title)}</b>${extra}</td><td>${fmtDate(i.at)}</td><td>${i.published === false ? '<span class="tag bad">Жасырын</span>' : '<span class="tag ok">Жарияланған</span>'}</td><td style="text-align:right;white-space:nowrap"><button class="btn sm" data-a="itemPub" data-id="${i.id}">${i.published === false ? "Жариялау" : "Жасыру"}</button><button class="iconbtn" data-a="itemDel" data-id="${i.id}" title="Жою">${icon("trash", 16)}</button></td></tr>`;
const itemTable = (type, extraFn) => { const L = S.items.filter(i => i.type === type).sort((a, b) => (b.at || "").localeCompare(a.at || "")); return L.length ? `<div class="card mt"><table class="t"><tr><th>Атауы</th><th>Күні</th><th>Күйі</th><th></th></tr>${L.map(i => itemRow(i, extraFn ? extraFn(i) : "")).join("")}</table></div>` : `<div class="empty small mt">Әзірге жоқ.</div>`; };
const curators = () => S.allP.map(d => ({ id: d.id, p: { ...newP(), ...d } }));
const AD = {};
AD.overview = () => {
  const cs = curators(), n = cs.length, wk = Date.now() - 7 * 864e5;
  const active = cs.filter(c => c.p.lastActive && new Date(c.p.lastActive) > wk).length;
  const avgMods = n ? (cs.reduce((a, c) => a + Object.keys(c.p.done).length, 0) / n).toFixed(1) : 0;
  const qv = cs.flatMap(c => Object.values(c.p.quiz)); const avgQ = qv.length ? Math.round(qv.reduce((a, b) => a + b, 0) / qv.length) : 0;
  const chP = cs.filter(c => c.p.chStart).length, casesN = cs.reduce((a, c) => a + Object.keys(c.p.cases).length, 0);
  return `<div class="grid g4 keep2">${[["Кураторлар", n], ["7 күнде белсенді", active], ["Орташа модуль", avgMods], ["Орташа тест балы", avgQ + "%"], ["Челлендж қатысушылары", chP], ["Шешілген кейстер", casesN], ["Материалдар", S.items.filter(i => ["material", "lesson", "book"].includes(i.type)).length], ["Берілген сертификаттар", S.items.filter(i => i.type === "cert").length]].map(([l, v]) => `<div class="card"><div class="stat">${v}</div><div class="small muted">${l}</div></div>`).join("")}</div>
  <div class="card mt"><h3>Модульдерді аяқтау деңгейі</h3>${n ? D.modules.map(m => { const c = cs.filter(x => x.p.done[m.id]).length, pc = Math.round(c / n * 100); return `<div class="hbar"><span>${m.n}. ${esc(m.title.slice(0, 26))}</span><div class="bar"><i style="width:${pc}%"></i></div><b>${pc}%</b></div>`; }).join("") : `<p class="small muted">Кураторлар платформаны қолдана бастағанда статистика пайда болады.</p>`}</div>`;
};
AD.users = () => {
  const cs = curators(), det = S.ui.userDetail && cs.find(c => c.id === S.ui.userDetail);
  if (det) {
    const p = det.p, sc = S.scores[det.id] || {}, cases = allCases();
    return `<button class="btn sm" data-a="userDet" data-id="">${icon("left", 15)}Барлық кураторлар</button>
    <div class="card mt"><h2>${esc(S.names[det.id] || "Куратор")}</h2><div class="kv"><b>Топ</b><span>${esc(p.profile.group || "—")}</span><b>Қала</b><span>${esc(p.profile.city || "—")}</span><b>Тәжірибе</b><span>${esc(p.profile.exp || "—")}</span><b>Модульдер</b><span>${Object.keys(p.done).length}/18</span><b>XP</b><span>${xpOf(p, det.id)}</span><b>Челлендж</b><span>${Object.keys(p.ch).length}/30</span><b>Соңғы белсенділік</b><span>${fmtDate(p.lastActive)}</span></div></div>
    <div class="card mt"><h3>Case Battle шешімдері</h3>${Object.keys(p.cases).length ? Object.entries(p.cases).map(([cid, a]) => { const c = cases.find(x => x.id === cid); return `<div class="item mt"><b>${esc(c ? c.t : cid)}</b> ${a.ai ? `<span class="tag">AI: ${a.ai.score}</span>` : ""}<div class="tpl mt" style="margin-top:6px">${esc(a.text)}</div><div class="row mt" style="margin-top:8px"><input class="in" style="width:110px" type="number" min="0" max="100" id="sc-${det.id}-${cid}" value="${sc[cid] != null ? sc[cid] : ""}" placeholder="0–100"><button class="btn sm pri" data-a="scoreSave" data-u="${det.id}" data-c="${cid}">Баға қою</button></div></div>`; }).join("") : `<p class="small muted">Жоқ.</p>`}</div>
    <div class="card mt"><h3>Тапсырма жауаптары</h3>${Object.keys(p.tasks).length ? Object.entries(p.tasks).map(([tid, a]) => { const it = S.items.find(i => i.id === tid); return `<div class="item mt"><b>${esc(it ? it.title : tid)}</b> <span class="tiny muted">${fmtDate(a.at)}</span><div class="tpl mt" style="margin-top:6px">${esc(a.text)}</div></div>`; }).join("") : `<p class="small muted">Жоқ.</p>`}</div>
    <div class="card mt"><h3>Тест нәтижелері</h3>${Object.entries(p.quiz).map(([k, v]) => `<span class="tag ${v >= 70 ? "ok" : "bad"}" style="margin:2px">${esc(k)}: ${v}%</span>`).join("") || '<p class="small muted">Жоқ.</p>'}</div>`;
  }
  return `<div class="card"><h3>Кураторларды шақыру және рөлдер</h3><p class="small">Платформаға кіру claude.ai бөлісу жүйесі арқылы басқарылады — бұл рөлді өз бетімен иемденуге мүмкіндік бермейді:</p>
    <ol class="steps small"><li>Осы беттің жоғарғы жағындағы <b>«Бөлісу» (Share)</b> батырмасын басыңыз.</li><li>Кураторды email арқылы қосып, <b>Contributor</b> (қатысушы) деңгейін беріңіз — ол модульдерді оқып, прогресін сақтай алады.</li><li>Әкімші құқығын тек <b>Editor</b> деңгейі береді — оны тек сенімді адамдарға беріңіз.</li><li>Қолжетімділікті алып тастау үшін сол мәзірден адамды өшіріңіз.</li></ol></div>
  <div class="card mt"><h3>Кураторлар белсенділігі (${cs.length})</h3>${cs.length ? `<table class="t"><tr><th>Куратор</th><th>Модуль</th><th>Тест</th><th>Челлендж</th><th>Кейс</th><th>Соңғы кіру</th><th></th></tr>${cs.sort((a, b) => (b.p.lastActive || "").localeCompare(a.p.lastActive || "")).map(c => { const qv = Object.values(c.p.quiz); return `<tr><td><b>${esc(S.names[c.id] || "Куратор")}</b><div class="tiny muted">${esc(c.p.profile.group || "")}</div></td><td>${Object.keys(c.p.done).length}</td><td>${qv.length ? Math.round(qv.reduce((a, b) => a + b, 0) / qv.length) + "%" : "—"}</td><td>${Object.keys(c.p.ch).length}</td><td>${Object.keys(c.p.cases).length}</td><td>${fmtDate(c.p.lastActive)}</td><td><button class="btn sm" data-a="userDet" data-id="${c.id}">Толығырақ</button></td></tr>`; }).join("")}</table>` : `<p class="small muted">Әзірге ешкім кірмеген.</p>`}</div>`;
};
AD.modules = () => {
  const hidden = (S.cfg.modules && S.cfg.modules.hidden) || [];
  return `<div class="card"><h3>Модульдерді жариялау</h3><table class="t">${D.modules.map(m => `<tr><td>${m.n}. <b>${esc(m.title)}</b></td><td>${hidden.includes(m.id) ? '<span class="tag bad">Жасырын</span>' : '<span class="tag ok">Жарияланған</span>'}</td><td style="text-align:right"><button class="btn sm" data-a="modToggle" data-m="${m.id}">${hidden.includes(m.id) ? "Жариялау" : "Жасыру"}</button></td></tr>`).join("")}</table></div>
  <div class="card mt"><h3>Жаңа сабақ қосу</h3><label class="lb">Модуль</label>${modSelect("ls-mod")}${fld("ls-title", "Сабақ атауы")}${fld("ls-body", "Мазмұны", "", "Теория, мысалдар, нұсқаулар...", "textarea")}<label class="lb"><input type="checkbox" id="ls-pub" checked> Бірден жариялау</label><button class="btn pri mt" data-a="addLesson">${icon("plus", 16)}Сабақ қосу</button></div>
  <h3 class="mt2">Қосылған сабақтар</h3>${itemTable("lesson", i => `<div class="tiny muted">${esc((D.modules.find(m => m.id === i.module) || {}).title || "")}</div>`)}`;
};
AD.library = () => `<div class="card"><h3>PDF кітап жүктеу</h3>${S.assets ? `<input type="file" accept="application/pdf" class="in" data-file="up">${fld("bk-title", "Атауы")}${fld("bk-cat", "Санаты", "", "Мысалы: Мотивация")}${fld("bk-desc", "Сипаттамасы", "", "", "textarea")}<label class="lb"><input type="checkbox" id="bk-dl"> Кураторларға жүктеуге рұқсат</label><label class="lb"><input type="checkbox" id="bk-pub" checked> Бірден жариялау</label><button class="btn pri mt" data-a="addBook" ${S.ui.busy.up ? "disabled" : ""}>${S.ui.busy.up ? '<span class="spin"></span> Жүктелуде...' : icon("upload", 16) + "Жүктеу"}</button>` : `<p class="small muted">Файл жүктеу тек Editor/Owner деңгейінде қолжетімді.</p>`}</div>
  <h3 class="mt2">Жүктелген кітаптар</h3>${itemTable("book")}<p class="tiny muted mt">8 кірістірілген Storybook кітабы әрқашан қолжетімді.</p>`;
AD.materials = () => `<div class="card"><h3>Материал қосу</h3>${fld("mt-title", "Атауы")}${fld("mt-cat", "Санаты", "", "Мысалы: LIVE сценарийі")}${fld("mt-body", "Мәтіні", "", "Шаблон мәтіні. {Аты}, {Ата-ана аты} сияқты орындарды қолдануға болады.", "textarea")}
  ${S.assets ? `<label class="lb">Файл тіркеу (міндетті емес)</label><input type="file" class="in" data-file="up">` : ""}<label class="lb"><input type="checkbox" id="mt-pub" checked> Бірден жариялау</label><button class="btn pri mt" data-a="addMaterial" ${S.ui.busy.up ? "disabled" : ""}>${icon("plus", 16)}Қосу</button></div>
  <h3 class="mt2">Қосылған материалдар</h3>${itemTable("material")}`;
AD.quizzes = () => `<div class="card"><h3>Тест құрастыру</h3>${fld("qz-title", "Тест атауы")}${fld("qz-desc", "Сипаттамасы")}
  <label class="lb">Сұрақтар</label><textarea class="in" id="qz-body" style="min-height:200px" placeholder="Сұрақ мәтіні?\n+ Дұрыс жауап\n- Қате жауап\n- Қате жауап\n\nКелесі сұрақ?\n- Қате\n+ Дұрыс"></textarea>
  <p class="tiny muted">Әр сұрақты бос жолмен бөліңіз. Дұрыс жауап «+», қате жауап «−» белгісімен басталады.</p><label class="lb"><input type="checkbox" id="qz-pub" checked> Бірден жариялау</label><button class="btn pri mt" data-a="addQuiz">${icon("plus", 16)}Тест қосу</button></div>
  <h3 class="mt2">Құрастырылған тесттер</h3>${itemTable("quiz", i => `<div class="tiny muted">${(i.qs || []).length} сұрақ</div>`)}`;
AD.tasks = () => `<div class="card"><h3>Практикалық тапсырма қосу</h3><label class="lb">Модуль (тапсырма сол модульде және Академияда көрінеді)</label>${modSelect("tk-mod", "m09")}${fld("tk-title", "Атауы")}${fld("tk-body", "Тапсырма шарты", "", "", "textarea")}<label class="lb"><input type="checkbox" id="tk-pub" checked> Бірден жариялау</label><button class="btn pri mt" data-a="addTask">${icon("plus", 16)}Қосу</button></div>
  <h3 class="mt2">Тапсырмалар</h3>${itemTable("task")}<p class="tiny muted mt">Кураторлардың жауаптарын «Кураторлар → Толығырақ» бөлімінен көресіз.</p>`;
AD.cases = () => {
  const cs = curators(), subs = []; cs.forEach(c => Object.entries(c.p.cases).forEach(([cid, a]) => subs.push({ u: c.id, cid, a })));
  const cases = allCases(), sc = S.scores;
  return `<div class="card"><h3>Жаңа кейс</h3>${fld("cs-title", "Атауы")}<label class="lb">Деңгейі</label><select class="in" id="cs-lvl"><option>Жеңіл</option><option selected>Орташа</option><option>Қиын</option></select>${fld("cs-s", "Жағдай", "", "", "textarea")}${fld("cs-task", "Тапсырма", "", "", "textarea")}<label class="lb"><input type="checkbox" id="cs-pub" checked> Бірден жариялау</label><button class="btn pri mt" data-a="addCase">${icon("plus", 16)}Кейс қосу</button></div>
  <h3 class="mt2">Қосылған кейстер</h3>${itemTable("case")}
  <h3 class="mt2">Шешімдерді бағалау (${subs.length})</h3>${subs.length ? `<div class="list">${subs.sort((a, b) => (b.a.at || "").localeCompare(a.a.at || "")).map(s => { const c = cases.find(x => x.id === s.cid); const cur = (sc[s.u] || {})[s.cid]; return `<details class="item"><summary><span>${esc(S.names[s.u] || "Куратор")} · ${esc(c ? c.t : s.cid)} ${cur != null ? `<span class="tag ok">Баға: ${cur}</span>` : '<span class="tag">Бағаланбаған</span>'} ${s.a.ai ? `<span class="tag">AI: ${s.a.ai.score}</span>` : ""}</span></summary><div class="tpl">${esc(s.a.text)}</div><div class="row mt" style="margin-top:8px"><input class="in" style="width:110px" type="number" min="0" max="100" id="sc-${s.u}-${s.cid}" value="${cur != null ? cur : ""}" placeholder="0–100"><button class="btn sm pri" data-a="scoreSave" data-u="${s.u}" data-c="${s.cid}">Баға қою</button></div></details>`; }).join("")}</div>` : `<div class="empty small">Шешім жоқ.</div>`}`;
};
AD.challenge = () => { const c = S.cfg.challenge || {}; return `<div class="card"><h3>30 күндік челлендж</h3>${fld("ch-title", "Атауы", c.title || "30 күндік кураторлық челлендж")}${fld("ch-desc", "Сипаттамасы", c.desc || "Күн сайын бір кәсіби қадам. 30 күнде — жаңа әдеттер.")}
  <label class="lb">Күнделікті тапсырмалар (әр жолға бір күн, дәл 30 жол)</label><textarea class="in" id="ch-tasks" style="min-height:300px">${esc(chList().join("\n"))}</textarea>
  <label class="lb"><input type="checkbox" id="ch-active" ${c.active === false ? "" : "checked"}> Челлендж белсенді</label><div class="row mt"><button class="btn pri" data-a="saveChallenge">Сақтау</button><button class="btn" data-a="resetChallengeTasks">Стандартты тапсырмаларды қайтару</button></div></div>`; };
AD.certs = () => {
  const cs = curators();
  return `<div class="grid g2"><div class="card"><h3>Сертификат беру</h3><label class="lb">Куратор</label><select class="in" id="ce-user">${cs.map(c => `<option value="${c.id}">${esc(S.names[c.id] || "Куратор")}${c.p.profile.group ? " · " + esc(c.p.profile.group) : ""}</option>`).join("") || "<option value=''>Куратор жоқ</option>"}</select>
    <label class="lb">Түрі</label><select class="in" id="ce-type">${certTypes().map(t => `<option value="${t.k}">${esc(t.t)}</option>`).join("")}</select>${fld("ce-sub", "Қосымша мәтін (міндетті емес)")}<label class="lb">Күні</label><input class="in" type="date" id="ce-date" value="${todayISO()}"><button class="btn pri mt" data-a="issueCert">${icon("award", 16)}Беру</button></div>
  <div class="card"><h3>Жаңа сертификат үлгісі</h3>${fld("tp-title", "Атауы", "", "Мысалы: Үздік тәлімгер")}${fld("tp-sub", "Мәтіні", "", "…үшін")}<div class="grid g2"><div><label class="lb">Негізгі түс</label><input type="color" class="in" id="tp-c1" value="#0f1b3d" style="height:44px"></div><div><label class="lb">Алтын түс</label><input type="color" class="in" id="tp-c2" value="#d4a548" style="height:44px"></div></div><button class="btn pri mt" data-a="addTpl">${icon("plus", 16)}Үлгі қосу</button></div></div>
  <h3 class="mt2">Үлгілер</h3>${itemTable("certtpl")}
  <h3 class="mt2">Берілген сертификаттар</h3>${(() => { const L = S.items.filter(i => i.type === "cert"); return L.length ? `<div class="card"><table class="t"><tr><th>Куратор</th><th>Сертификат</th><th>Күні</th><th></th></tr>${L.map(i => `<tr><td>${esc(S.names[i.recipientId] || "Куратор")}</td><td>${esc(i.title)}</td><td>${fmtDate(i.date || i.at)}</td><td style="text-align:right"><button class="iconbtn" data-a="itemDel" data-id="${i.id}">${icon("trash", 16)}</button></td></tr>`).join("")}</table></div>` : `<div class="empty small">Жоқ.</div>`; })()}`;
};
AD.ann = () => `<div class="card"><h3>Хабарландыру жариялау</h3>${fld("an-title", "Тақырып")}${fld("an-body", "Мәтін", "", "", "textarea")}<button class="btn pri mt" data-a="addAnn">${icon("bell", 16)}Жариялау</button></div><h3 class="mt2">Хабарландырулар</h3>${itemTable("announce")}`;
AD.ai = () => { const c = cfgAI(); return `<div class="card"><h3>AI интеграциясы</h3><p class="small muted">AI Ментор, хабарлама генераторы, кейс бағалау және рөлдік ойын Claude арқылы қауіпсіз орындалады — API кілттері бетке енгізілмейді.</p>
  <label class="lb"><input type="checkbox" id="ai-on" ${c.enabled === false ? "" : "checked"}> Кураторлар үшін AI құралдарын қосу</label>
  ${fld("ai-extra", "AI-ге қосымша нұсқаулар (стиль, ережелер, орталық ерекшеліктері)", c.extra || "", "Мысалы: Хабарламаларда эмодзиді аз қолдан. Жұмыс уақыты 9:00–21:00 екенін ескер.", "textarea")}
  <button class="btn pri mt" data-a="saveAI">Сақтау</button>${S.sample ? "" : `<p class="small muted mt">Бұл көріністе AI қолжетімсіз.</p>`}</div>`; };
AD.settings = () => { const P = S.cfg.platform || {}; return `<div class="card"><h3>Платформа баптаулары</h3>${fld("pl-name", "Платформа атауы", P.name || "JUZ40 CURATOR HUB")}${fld("pl-slogan", "Ұран", P.slogan || "Кураторлық – жай міндет емес, адамға әсер ету өнері")}${fld("pl-phil", "Философия", P.philosophy || "Білім. Құндылық. Байланыс. Нәтиже")}<button class="btn pri mt" data-a="savePlatform">Сақтау</button></div>`; };

async function addItem(type, data, pub = true) {
  if (!S.db) { toast("Деректер қоры қолжетімсіз"); return false; }
  const id = uidGen();
  const ok = await dbSet("items/" + id, { type, ...data, published: pub, at: new Date().toISOString(), by: S.uid || "" });
  if (ok) toast("Сақталды ✓");
  return ok;
}
function clearFields(...ids) { ids.forEach(i => { const e = document.getElementById(i); if (e) e.value = ""; }); }
function parseQuiz(t) {
  return t.split(/\n\s*\n/).map(b => b.split("\n").map(l => l.trim()).filter(Boolean)).filter(b => b.length >= 3).map(b => {
    const q = b[0], opts = b.slice(1); const o = [], a = [];
    opts.forEach(l => { const right = /^\+/.test(l); o.push(l.replace(/^[+\-−–]\s*/, "")); if (right) a.push(o.length - 1); });
    return { q, o, a: a.length ? a[0] : 0 };
  });
}

/* ---------- AI ---------- */
async function ai(input, onText, opts = {}) {
  if (!S.sample) throw { code: "not_granted" };
  return S.sample(input, { cache: false, onText: onText ? (e => onText(e.text)) : undefined, ...opts });
}
function aiErr(e) {
  if (e && e.code === "rate_limited") toast("Сұраныс тым көп, сәл күтіңіз");
  else if (e && e.code === "not_granted") { toast("AI рұқсаты берілмеді"); }
  else toast("AI жауап бере алмады, қайта көріңіз");
}
function scrollLog(id) { const l = document.getElementById(id); if (l) l.scrollTop = l.scrollHeight; }

/* ---------- ACTIONS ---------- */
const A = {
  toggleView() { S.asCurator = !S.asCurator; buildIndex(); render(true); },
  fav(b) { const k = b.dataset.k; const f = S.p.favs; const i = f.indexOf(k); if (i >= 0) f.splice(i, 1); else f.push(k); saveP(); render(true); toast(i >= 0 ? "Таңдаулыдан алынды" : "Таңдаулыға қосылды ★"); },
  copy(b) { copyText(b.dataset.t); },
  done(b) { const m = b.dataset.m; if (S.p.done[m]) delete S.p.done[m]; else { S.p.done[m] = new Date().toISOString(); toast("Модуль аяқталды! +50 XP"); } saveP(); render(true); },
  motCat(b) { S.ui.motCat = D.motivation.findIndex(c => c.cat === b.dataset.v); render(true); },
  parCat(b) { S.ui.parCat = D.parentComm.findIndex(c => c.cat === b.dataset.v); render(true); },
  gameCat(b) { S.ui.gameCat = b.dataset.v; render(true); },
  matCat(b) { S.ui.matCat = b.dataset.v; render(true); },
  libCat(b) { S.ui.libCat = b.dataset.v; render(true); },
  acad(b) { S.ui.acadTab = b.dataset.t; if (S.view !== "m09") return; render(true); },
  adm(b) { S.ui.admTab = b.dataset.t; S.ui.userDetail = null; render(true); },
  bp(b) { const id = b.dataset.id, d = +b.dataset.d; const n = (S.ui.bookPage[id] || 0) + d; goPage(id, n); },
  bpGo(b) { goPage(b.dataset.id, +b.dataset.p); },
  pdfp(b) { const id = b.dataset.id; S.ui.bookPage[id] = Math.max(0, (S.ui.bookPage[id] || 0) + (+b.dataset.d)); const n = S.p.books[id + ":n"]; if (n) S.ui.bookPage[id] = Math.min(n - 1, S.ui.bookPage[id]); const bk = allBooks().find(x => x.id === id); renderPdf(bk); },
  qsel(b) { const q = b.dataset.q; S.ui.quizSel[q] = S.ui.quizSel[q] || {}; S.ui.quizSel[q][+b.dataset.i] = +b.dataset.j; render(true); },
  qcheck(b) { const q = b.dataset.q, qs = quizById(q) || [], sel = S.ui.quizSel[q] || {};
    if (Object.keys(sel).length < qs.length) { toast("Барлық сұраққа жауап беріңіз"); return; }
    const r = Math.round(qs.filter((x, i) => sel[i] === x.a).length / qs.length * 100);
    S.ui.quizRes[q] = String(r); S.p.quiz[q] = Math.max(S.p.quiz[q] || 0, r); saveP(); render(true); },
  qreset(b) { const q = b.dataset.q; delete S.ui.quizRes[q]; delete S.ui.quizSel[q]; render(true); },
  sit(b) { S.ui.sitSel[+b.dataset.i] = +b.dataset.j; if (Object.keys(S.ui.sitSel).length === D.situations.length) { const got = D.situations.reduce((a, s, i) => a + s.o[S.ui.sitSel[i]].p, 0); S.p.quiz["situations"] = Math.max(S.p.quiz["situations"] || 0, Math.round(got / (D.situations.length * 3) * 100)); saveP(); } render(true); },
  sitReset() { S.ui.sitSel = {}; render(true); },
  taskSave(b) { const id = b.dataset.id, t = (S.ui.drafts["task:" + id] || "").trim(); if (!t) { toast("Жауап бос"); return; } S.p.tasks[id] = { text: t, at: new Date().toISOString() }; saveP(); render(true); toast("Тапсырылды ✓"); },
  chStart() { S.p.chStart = todayISO(); S.p.ch = {}; saveP(); render(true); toast("Челлендж басталды! 🔥"); },
  chReset() { if (S.ui.confirmCh !== true) { S.ui.confirmCh = true; toast("Қайта бастау үшін тағы бір рет басыңыз"); setTimeout(() => S.ui.confirmCh = false, 3000); return; } S.ui.confirmCh = false; S.p.chStart = todayISO(); S.p.ch = {}; saveP(); render(true); },
  chDone(b) { S.p.ch[+b.dataset.d] = todayISO(); saveP(); render(true); toast("Керемет! +10 XP 🔥"); },
  chToggle(b) { const d = +b.dataset.d; if (S.p.ch[d]) delete S.p.ch[d]; else { S.p.ch[d] = todayISO(); toast("+10 XP 🔥"); } saveP(); render(true); },
  caseOpen(b) { S.ui.openCase = b.dataset.id || null; render(true); window.scrollTo(0, 0); },
  caseSubmit(b) { const id = b.dataset.id, t = (S.ui.drafts["case:" + id] || "").trim(); if (t.length < 20) { toast("Шешімді толығырақ жазыңыз"); return; } const prev = S.p.cases[id] || {}; S.p.cases[id] = { ...prev, text: t, at: new Date().toISOString() }; saveP(); render(true); toast("Жіберілді! +30 XP"); },
  async caseAI(b) {
    const id = b.dataset.id, c = allCases().find(x => x.id === id), t = (S.ui.drafts["case:" + id] || (S.p.cases[id] || {}).text || "").trim();
    if (t.length < 20) { toast("Алдымен шешіміңізді жазыңыз"); return; }
    S.ui.busy.case = true; render(true);
    const prompt = `${SYS()}\n\nСен Case Battle төрешісісің. Куратордың кейс шешімін бағала.\nКейс: ${c.t}\nЖағдай: ${c.s}\nТапсырма: ${c.task}\nКуратордың шешімі: """${t}"""\n\nТек JSON қайтар: {"score": 0-100 бүтін сан, "strengths": [2-3 қысқа пункт қазақша], "improve": [2-3 қысқа пункт қазақша], "tip": "бір сөйлемдік кеңес қазақша"}. Бағалау критерийлері: эмпатия, нақтылық, этика, практикалық орындалуы, JUZ40 құндылықтарына сәйкестігі.`;
    try {
      let v; if (S.sample.json) v = await S.sample.json(prompt, { cache: false }); else { const r = await ai(prompt); v = JSON.parse((r.text.match(/\{[\s\S]*\}/) || ["{}"])[0]); }
      const prev = S.p.cases[id] || {}; S.p.cases[id] = { ...prev, text: t, at: prev.at || new Date().toISOString(), ai: { score: Math.max(0, Math.min(100, Math.round(+v.score || 0))), strengths: (v.strengths || []).slice(0, 4), improve: (v.improve || []).slice(0, 4), tip: v.tip || "" } };
      saveP();
    } catch (e) { aiErr(e); }
    S.ui.busy.case = false; render(true);
  },
  async chatSend(b, e, preset) {
    const t = (preset || S.ui.drafts["chat:in"] || "").trim(); if (!t || S.ui.busy.chat) return;
    S.ui.drafts["chat:in"] = ""; S.ui.chat.push({ role: "user", content: t }); S.ui.chat.push({ role: "assistant", content: "" }); S.ui.busy.chat = true; render(true); scrollLog("chatlog");
    const msgs = S.ui.chat.slice(0, -1).map((m, i) => ({ role: m.role, content: i === 0 ? SYS() + "\n\nКуратордың сұрағы:\n" + m.content : m.content }));
    try {
      const r = await ai(msgs, txt => { S.ui.chat[S.ui.chat.length - 1].content = txt; const l = document.getElementById("chatlog"); if (l && l.lastElementChild) { const last = [...l.querySelectorAll(".bub")].pop(); if (last) { last.innerHTML = `<span class="who">AI Ментор</span>${esc(txt)}`; } l.scrollTop = l.scrollHeight; } });
      S.ui.chat[S.ui.chat.length - 1].content = r.text;
    } catch (e2) { S.ui.chat.pop(); aiErr(e2); }
    S.ui.busy.chat = false; render(true); scrollLog("chatlog");
  },
  chatSug(b) { A.chatSend(b, null, b.dataset.t); },
  chatClear() { S.ui.chat = []; render(true); },
  genPreset(b) { S.ui.drafts["gen:kind"] = b.dataset.k; },
  async gen() {
    const kind = (GEN_KINDS.find(k => k[0] === draft("gen:kind", "mot")) || GEN_KINDS[0])[1];
    const sit = draft("gen:sit").trim(); if (!sit) { toast("Жағдайды сипаттаңыз"); return; }
    S.ui.busy.gen = true; S.ui.gen = ""; render(true);
    const prompt = `${SYS()}\n\nТапсырма: «${kind}» жаз.\nКімге: ${draft("gen:to") || "көрсетілмеген"}\nЖағдай: ${sit}\nТон: ${draft("gen:tone", "Жылы")}\nНұсқа саны: ${draft("gen:n", "2")}\nWhatsApp-қа бірден жіберуге дайын болсын. Әр нұсқаны «Нұсқа 1:», «Нұсқа 2:» деп бөл. Түсіндірме жазба, тек мәтіндерді қайтар.`;
    try { const r = await ai(prompt, txt => { S.ui.gen = txt; const o = $("#genout"); if (o) o.textContent = txt; }); S.ui.gen = r.text; } catch (e) { aiErr(e); }
    S.ui.busy.gen = false; render(true);
  },
  async rpStart(b) { const r = D.roleplays.find(x => x.id === b.dataset.id); S.ui.rp = r.id; S.ui.rpEval = ""; S.ui.rpLog = [{ role: "assistant", content: r.start }]; render(true); },
  rpStop() { S.ui.rp = null; S.ui.rpLog = []; S.ui.rpEval = ""; render(true); },
  async rpSend() {
    const t = (S.ui.drafts["rp:in"] || "").trim(); if (!t || S.ui.busy.rp) return;
    const r = D.roleplays.find(x => x.id === S.ui.rp); S.ui.drafts["rp:in"] = ""; S.ui.rpLog.push({ role: "user", content: t }); S.ui.busy.rp = true; render(true); scrollLog("rplog");
    const intro = `Біз кураторларды оқытуға арналған рөлдік ойын ойнаймыз. ${r.brief} Тек кейіпкер ретінде, табиғи сөйлеу тілінде, қазақша, 1–3 сөйлеммен жауап бер. Рөлден шықпа, түсініктеме жазба. Сенің алғашқы сөзің: «${r.start}»`;
    const msgs = [{ role: "user", content: intro }, { role: "assistant", content: r.start }, ...S.ui.rpLog.slice(1)];
    try { const res = await ai(msgs); S.ui.rpLog.push({ role: "assistant", content: res.text.trim() }); } catch (e) { S.ui.rpLog.pop(); S.ui.drafts["rp:in"] = t; aiErr(e); }
    S.ui.busy.rp = false; render(true); scrollLog("rplog");
  },
  async rpEval() {
    const r = D.roleplays.find(x => x.id === S.ui.rp); if (S.ui.rpLog.length < 3) { toast("Алдымен бірнеше хабарлама алмасыңыз"); return; }
    S.ui.busy.rp = true; S.ui.rpEval = ""; render(true);
    const tr = S.ui.rpLog.map(m => (m.role === "user" ? "Куратор: " : r.who + ": ") + m.content).join("\n");
    try { const res = await ai(`${SYS()}\n\nТөмендегі рөлдік ойындағы куратордың жұмысын бағала. Жағдай: ${r.t}.\n${tr}\n\nҚұрылым: 1) Жалпы баға (10 баллдық шкала); 2) Не жақсы болды (2–3 пункт); 3) Нені жақсартуға болады (2–3 пункт, нақты балама сөйлемдермен); 4) Бір негізгі кеңес.`, txt => { S.ui.rpEval = txt; }); S.ui.rpEval = res.text; } catch (e) { aiErr(e); }
    S.ui.busy.rp = false; render(true);
  },
  burnCheck() { const a = S.ui.burn || {}; if (Object.keys(a).length < D.burnout.length) { toast("Барлық сұраққа жауап беріңіз"); return; } const s = Object.values(a).reduce((x, y) => x + y, 0); S.p.burnout = { score: s, at: new Date().toISOString() }; S.ui.burnShow = true; saveP(); render(true); },
  async certDl(b) { try { const f = await certFile(certOpts(), b.dataset.f); await saveFile(f); } catch (e) { toast("Файл жасау мүмкін болмады"); } },
  async myCertDl(b) { const c = S.items.find(i => i.id === b.dataset.id); const t = certTypes().find(x => x.k === c.kind) || {}; try { await saveFile(await certFile({ title: c.title, sub: c.sub, name: S.myName, date: c.date || c.at, by: "JUZ40 Curator Hub", c1: c.c1 || t.c1 || "#0f1b3d", c2: c.c2 || t.c2 || "#d4a548" }, "pdf")); } catch (e) { toast("Файл жасау мүмкін болмады"); } },
  async postAdd() {
    const t = (S.ui.drafts["post"] || "").trim(); if (t.length < 10) { toast("Жазба тым қысқа"); return; }
    const mine = (S.posts.find(p => p.id === S.uid) || {}).list || [];
    const list = [{ id: uidGen(), text: t.slice(0, 2000), at: new Date().toISOString() }, ...mine].slice(0, 20);
    if (await dbSet("posts/" + S.uid, { list })) { S.ui.drafts["post"] = ""; toast("Жарияланды ✓"); }
  },
  async postDel(b) { const u = b.dataset.u, d = S.posts.find(p => p.id === u); if (!d) return; await dbSet("posts/" + u, { list: (d.list || []).filter(p => p.id !== b.dataset.id) }); },
  /* admin */
  userDet(b) { S.ui.userDetail = b.dataset.id || null; render(true); window.scrollTo(0, 0); },
  async modToggle(b) { const m = b.dataset.m, h = [...((S.cfg.modules && S.cfg.modules.hidden) || [])]; const i = h.indexOf(m); if (i >= 0) h.splice(i, 1); else h.push(m); await dbSet("config/modules", { hidden: h }); },
  async itemPub(b) { const it = S.items.find(i => i.id === b.dataset.id); if (!it) return; try { await S.db.doc("items/" + it.id).update({ published: it.published === false }); } catch (e) { toast("Қате"); } },
  async itemDel(b) { const id = b.dataset.id; if (S.ui.confirmDel !== id) { S.ui.confirmDel = id; toast("Жою үшін тағы бір рет басыңыз"); setTimeout(() => { if (S.ui.confirmDel === id) S.ui.confirmDel = null; }, 3000); return; } S.ui.confirmDel = null; const it = S.items.find(i => i.id === id); if (await dbDel("items/" + id)) { if (it && it.assetId && S.assets) { try { await S.assets.delete(it.assetId); } catch (e) {} } toast("Жойылды"); } },
  async addLesson() { const t = val("ls-title"), body = val("ls-body"); if (!t || !body) { toast("Атауы мен мазмұнын толтырыңыз"); return; } if (await addItem("lesson", { title: t, body, module: val("ls-mod") }, val("ls-pub"))) clearFields("ls-title", "ls-body"); },
  async addBook() {
    const f = S.ui.upFile, t = val("bk-title"); if (!f || !t) { toast("PDF файл мен атауын көрсетіңіз"); return; }
    S.ui.busy.up = true; render(true);
    try { const r = await S.assets.upload(f); await addItem("book", { title: t, cat: val("bk-cat") || "PDF кітап", desc: val("bk-desc"), assetId: r.id, url: r.url, allowDl: !!val("bk-dl"), fileName: f.name }, val("bk-pub")); S.ui.upFile = null; }
    catch (e) { toast("Жүктеу сәтсіз: " + ((e && e.message) || "")); }
    S.ui.busy.up = false; render(true);
  },
  async addMaterial() {
    const t = val("mt-title"); if (!t) { toast("Атауын жазыңыз"); return; }
    const data = { title: t, cat: val("mt-cat") || "Жаңа материал", body: val("mt-body") };
    if (S.ui.upFile && S.assets) { S.ui.busy.up = true; try { const r = await S.assets.upload(S.ui.upFile); data.assetId = r.id; data.url = r.url; data.fileName = S.ui.upFile.name; } catch (e) { toast("Файл жүктелмеді"); S.ui.busy.up = false; return; } S.ui.busy.up = false; S.ui.upFile = null; }
    if (await addItem("material", data, val("mt-pub"))) clearFields("mt-title", "mt-cat", "mt-body");
  },
  async addQuiz() { const t = val("qz-title"), qs = parseQuiz(val("qz-body")); if (!t || !qs.length) { toast("Атауы мен кемінде бір сұрақ қажет"); return; } if (await addItem("quiz", { title: t, desc: val("qz-desc"), qs }, val("qz-pub"))) { clearFields("qz-title", "qz-desc", "qz-body"); toast(qs.length + " сұрақ сақталды"); } },
  async addTask() { const t = val("tk-title"), body = val("tk-body"); if (!t || !body) { toast("Толтырыңыз"); return; } if (await addItem("task", { title: t, body, module: val("tk-mod") }, val("tk-pub"))) clearFields("tk-title", "tk-body"); },
  async addCase() { const t = val("cs-title"), s = val("cs-s"); if (!t || !s) { toast("Толтырыңыз"); return; } if (await addItem("case", { title: t, lvl: val("cs-lvl"), s, task: val("cs-task") }, val("cs-pub"))) clearFields("cs-title", "cs-s", "cs-task"); },
  async scoreSave(b) { const u = b.dataset.u, c = b.dataset.c, v = Math.max(0, Math.min(100, Math.round(+val(`sc-${u}-${c}`) || 0))); const cur = { ...(S.scores[u] || {}), [c]: v }; if (await dbSet("scores/" + u, { cases: cur })) toast("Баға сақталды ✓"); },
  async saveChallenge() { const tasks = val("ch-tasks").split("\n").map(s => s.trim()).filter(Boolean); if (tasks.length !== 30) { toast(`Дәл 30 жол керек (қазір ${tasks.length})`); return; } if (await dbSet("config/challenge", { title: val("ch-title"), desc: val("ch-desc"), tasks, active: !!val("ch-active") })) toast("Сақталды ✓"); },
  async resetChallengeTasks() { const c = S.cfg.challenge || {}; await dbSet("config/challenge", { ...c, tasks: [] }); },
  async issueCert() { const u = val("ce-user"); if (!u) { toast("Куратор таңдаңыз"); return; } const t = certTypes().find(x => x.k === val("ce-type")); if (await addItem("cert", { recipientId: u, kind: t.k, title: t.t, sub: val("ce-sub") || t.sub, date: val("ce-date"), c1: t.c1, c2: t.c2 })) clearFields("ce-sub"); },
  async addTpl() { const t = val("tp-title"); if (!t) { toast("Атауын жазыңыз"); return; } if (await addItem("certtpl", { title: t, sub: val("tp-sub"), c1: val("tp-c1"), c2: val("tp-c2") })) clearFields("tp-title", "tp-sub"); },
  async addAnn() { const t = val("an-title"), body = val("an-body"); if (!t) { toast("Тақырып жазыңыз"); return; } if (await addItem("announce", { title: t, body })) clearFields("an-title", "an-body"); },
  async saveAI() { if (await dbSet("config/ai", { enabled: !!val("ai-on"), extra: val("ai-extra") })) toast("Сақталды ✓"); },
  async savePlatform() { if (await dbSet("config/platform", { name: val("pl-name"), slogan: val("pl-slogan"), philosophy: val("pl-phil") })) toast("Сақталды ✓"); }
};
function goPage(id, n) { n = Math.max(0, Math.min(17, n)); S.ui.bookPage[id] = n; if ((S.p.books[id] || 0) < n || S.p.books[id] == null) { S.p.books[id] = Math.max(S.p.books[id] || 0, n); if (n === 17) toast("Кітап оқылды! +40 XP 📚"); saveP(); } render(true); window.scrollTo({ top: 0 }); }

document.addEventListener("click", e => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a; if (!A[a]) return;
  if (b.tagName !== "A") e.preventDefault();
  A[a](b, e);
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.draft) { S.ui.drafts[el.dataset.draft] = el.value; if (el.dataset.live === "cert") { const cv = $("#certCanvas"); if (cv) drawCert(cv, certOpts()); } if (el.dataset.live === "kpi") liveKpi(); }
  if (el.dataset.fill) S.ui.fill[el.dataset.fill] = el.value;
  if (el.dataset.bind === "matQ") { S.ui.matQ = el.value; clearTimeout(el._t); el._t = setTimeout(() => { const pos = el.selectionStart; render(true); const n = document.querySelector('[data-bind="matQ"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } }, 250); }
  if (el.id === "q") { S.ui.search = el.value; S.searchMode = !!el.value.trim(); clearTimeout(el._t); el._t = setTimeout(() => render(true), 200); }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.refl) { const v = el.value.trim(); if (v) S.p.refl[el.dataset.refl] = { text: v, at: new Date().toISOString() }; else delete S.p.refl[el.dataset.refl]; saveP(); toast("Сақталды ✓"); }
  if (el.dataset.prof) { S.p.profile[el.dataset.prof] = el.value.trim(); saveP(); toast("Профиль сақталды ✓"); }
  if (el.dataset.plan) { S.p.plan[el.dataset.plan] = el.value; saveP(); }
  if (el.dataset.burn) { S.ui.burn = S.ui.burn || {}; S.ui.burn[+el.dataset.burn] = +el.value; }
  if (el.dataset.bind === "certType") { S.ui.certType = el.value; delete S.ui.drafts["cert:sub"]; render(true); }
  if (el.dataset.fill) render(true);
  if (el.dataset.file) S.ui.upFile = el.files && el.files[0];
  if (el.dataset.draft === "gen:kind" || el.dataset.draft === "gen:tone" || el.dataset.draft === "gen:n") S.ui.drafts[el.dataset.draft] = el.value;
});
document.addEventListener("keydown", e => {
  if (S.view.startsWith("book-") && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) {
    const id = S.view.slice(5); if (D.books.find(b => b.id === id)) { if (e.key === "ArrowRight") goPage(id, (S.ui.bookPage[id] || 0) + 1); if (e.key === "ArrowLeft") goPage(id, (S.ui.bookPage[id] || 0) - 1); }
  }
  if (e.key === "Enter" && !e.shiftKey && e.target.dataset && (e.target.dataset.draft === "chat:in" || e.target.dataset.draft === "rp:in")) { e.preventDefault(); e.target.dataset.draft === "chat:in" ? A.chatSend() : A.rpSend(); }
});
function liveKpi() { const o = $("#kpiout"); if (!o) return; const tmp = document.createElement("div"); tmp.innerHTML = MR.m17(); const n = tmp.querySelector("#kpiout"); if (n) o.innerHTML = n.innerHTML; }

function after() {
  if (S.view === "m07") { const cv = $("#certCanvas"); if (cv) drawCert(cv, certOpts()); }
  if (S.view.startsWith("book-")) { const b = allBooks().find(x => x.id === S.view.slice(5)); if (b && b.pdf) renderPdf(b); }
  if (S.view === "m13") scrollLog("chatlog");
  if (S.view === "m09" && S.ui.acadTab === "rp") scrollLog("rplog");
}

/* ---------- NAMES ---------- */
let nameT;
function wantNames(ids) {
  const miss = ids.filter(id => id && S.names[id] == null);
  if (!miss.length || !S.user || !S.user.profiles) return;
  clearTimeout(nameT);
  nameT = setTimeout(async () => {
    try { const ps = await S.user.profiles(miss); miss.forEach(id => { S.names[id] = (ps && ps[id] && ps[id].name) || ""; }); render(); } catch (e) {}
  }, 100);
}

/* ---------- INIT ---------- */
async function init() {
  buildIndex(); route();
  window.addEventListener("hashchange", route);
  const cl = window.claude;
  if (!cl || !cl.use) { S.ready = true; render(true); return; }
  const use = n => cl.use(n).then(x => x, () => null);
  const [user, db, sample, assets, downloads] = await Promise.all(["user", "db", "sample", "assets", "downloads"].map(use));
  S.user = user; S.sample = sample; S.assets = assets; S.downloads = downloads;
  if (user) {
    try { S.isAdmin = !!(await user.isOwner()) || !!(await user.canEdit()); } catch (e) {}
    try { S.uid = await user.id(); } catch (e) {}
    try { const me = await user.me(); S.myName = (me && me.name) || ""; } catch (e) {}
    try { const cw = await user.can("data.write"); if (cw === false) S.canWrite = false; } catch (e) {}
  }
  if (S.uid) { const loc = LS.get("j40p:" + S.uid, null); if (loc) S.p = { ...newP(), ...loc }; }
  if (db) {
    S.db = db;
    if (S.uid) {
      try { const snap = await db.doc("progress/" + S.uid).get(); if (snap.exists) { const r = snap.data(); const local = S.p; S.p = { ...newP(), ...JSON.parse(JSON.stringify(r)) }; if (local.lastActive && (!r.lastActive || local.lastActive > r.lastActive)) { S.p = { ...newP(), ...local }; saveP(); } } else if (S.p.lastActive) saveP(); } catch (e) {}
    }
    const err = () => {};
    db.collection("items").onSnapshot(s => { S.items = s.docs.map(d => ({ id: d.id, ...d.data() })); buildIndex(); render(); }, err);
    db.collection("config").onSnapshot(s => { s.docs.forEach(d => S.cfg[d.id] = d.data()); render(); }, err);
    db.collection("scores").onSnapshot(s => { S.scores = {}; s.docs.forEach(d => S.scores[d.id] = (d.data().cases || {})); render(); }, err);
    db.collection("board").onSnapshot(s => { S.board = s.docs.map(d => ({ id: d.id, ...d.data() })); wantNames(S.board.map(r => r.id)); render(); }, err);
    db.collection("posts").onSnapshot(s => { S.posts = s.docs.map(d => ({ id: d.id, ...d.data() })); wantNames(S.posts.map(r => r.id)); render(); }, err);
    if (S.isAdmin) db.collection("progress").onSnapshot(s => { S.allP = s.docs.map(d => ({ id: d.id, ...d.data() })); wantNames(S.allP.map(r => r.id)); render(); }, err);
  }
  if (S.uid) S.names[S.uid] = S.myName;
  S.ready = true; buildIndex(); render(true);
  if (S.db && S.uid && S.canWrite) flush();
}
init();
})();
