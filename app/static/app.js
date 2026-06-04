"use strict";

const LINGER_MS = (window.LINGER_SECONDS || 3600) * 1000;
const TZ_STORE_KEY = "ec_last_tz";
const H12_STORE_KEY = "ec_hour12";

// Hour format: stored as "12" or "24". Default follows the browser locale.
let hour12 = localStorage.getItem(H12_STORE_KEY);
hour12 = hour12 === null ? undefined : hour12 === "12";

// Curated city -> IANA timezone lookup. Extend as needed.
const CITY_TZ = {
  "warsaw": "Europe/Warsaw",
  "warszawa": "Europe/Warsaw",
  "guarda": "Europe/Lisbon",
  "lisbon": "Europe/Lisbon",
  "lisboa": "Europe/Lisbon",
  "porto": "Europe/Lisbon",
  "london": "Europe/London",
  "berlin": "Europe/Berlin",
  "paris": "Europe/Paris",
  "madrid": "Europe/Madrid",
  "new york": "America/New_York",
  "los angeles": "America/Los_Angeles",
  "chicago": "America/Chicago",
  "tokyo": "Asia/Tokyo",
  "sydney": "Australia/Sydney",
  "utc": "UTC",
};

let events = []; // {id, title, start_utc, startMs}

// ---- data ----
async function loadEvents() {
  const res = await fetch("/api/events");
  const data = await res.json();
  events = data.map((e) => ({ ...e, startMs: Date.parse(e.start_utc) }));
  render();
}

async function deleteEvent(id) {
  await fetch(`/api/events/${id}`, { method: "DELETE" });
  await loadEvents();
}

async function addEvent(title, startMs) {
  const start_utc = new Date(startMs).toISOString();
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, start_utc }),
  });
  return res.ok;
}

// ---- formatting ----
function fmtCountdown(ms) {
  if (ms < 0) ms = 0;
  let s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (d > 0 || h > 0) parts.push(`${h}h`);
  if (d > 0 || h > 0 || m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function fmtLocal(startMs, tz) {
  const opts = {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  };
  if (tz) opts.timeZone = tz;
  if (hour12 !== undefined) opts.hour12 = hour12;
  return new Intl.DateTimeFormat(undefined, opts).format(new Date(startMs));
}

// ---- state derivation ----
function classify(now) {
  // visible = not yet fully elapsed past linger window
  const visible = events
    .filter((e) => e.startMs + LINGER_MS > now)
    .sort((a, b) => a.startMs - b.startMs);
  const inProgress = visible.find((e) => e.startMs <= now && now < e.startMs + LINGER_MS);
  let hero = null;
  if (inProgress) hero = inProgress;
  else hero = visible.find((e) => e.startMs > now) || null;
  const rest = visible.filter((e) => e !== hero);
  return { hero, rest };
}

// ---- rendering ----
const barsEl = document.getElementById("bars");
const emptyEl = document.getElementById("empty");

function render() {
  const now = Date.now();
  const { hero, rest } = classify(now);

  if (!hero && rest.length === 0) {
    barsEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  let html = "";
  if (hero) html += heroHtml(hero, rest[0] || null, now);
  for (const e of rest) html += compactHtml(e, now);
  barsEl.innerHTML = html;
}

function actionsHtml(e) {
  return `
    <button class="icon-btn tz-btn" data-id="${e.id}" data-start="${e.startMs}" title="Preview timezone">🌐</button>
    <button class="icon-btn del-btn" data-id="${e.id}" data-title="${escapeAttr(e.title)}" title="Delete">🗑</button>
  `;
}

function heroHtml(e, next, now) {
  const inProgress = e.startMs <= now;
  let center;
  if (inProgress) {
    const remain = e.startMs + LINGER_MS - now;
    let nextLine = "";
    if (next) {
      nextLine = `<div class="hero-next">Next: ${escapeHtml(next.title)} in <span class="cd" data-target="${next.startMs}"></span></div>`;
    }
    center = `
      <div class="hero-badge">● IN PROGRESS</div>
      <div class="hero-cd cd" data-target="${e.startMs + LINGER_MS}" data-leftlabel="left"></div>
      ${nextLine}`;
  } else {
    center = `
      <div class="hero-label">Starts in</div>
      <div class="hero-cd cd" data-target="${e.startMs}"></div>`;
  }
  return `
    <section class="bar hero">
      <div class="hero-actions">${actionsHtml(e)}</div>
      <h2 class="hero-title">${escapeHtml(e.title)}</h2>
      ${center}
      <div class="hero-when">${fmtLocal(e.startMs)} your time</div>
    </section>`;
}

function compactHtml(e, now) {
  return `
    <section class="bar compact">
      <span class="c-title">${escapeHtml(e.title)}</span>
      <span class="c-when">${fmtLocal(e.startMs)}</span>
      <span class="cd" data-target="${e.startMs}"></span>
      <span class="c-actions">${actionsHtml(e)}</span>
    </section>`;
}

// ---- tick ----
function tick() {
  const now = Date.now();
  // Re-render fully if hero/visibility membership changed.
  const before = barsEl.dataset.sig || "";
  const sig = classify(now).hero ? classify(now).hero.id + ":" + classify(now).rest.map(r => r.id).join(",") : "none";
  if (sig !== before) {
    render();
    barsEl.dataset.sig = sig;
  }
  // Update all countdowns from absolute targets.
  for (const el of document.querySelectorAll(".cd")) {
    const target = parseInt(el.dataset.target, 10);
    const txt = fmtCountdown(target - now);
    el.textContent = el.dataset.leftlabel ? `${txt} left` : txt;
  }
}

// ---- escaping ----
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function escapeAttr(s) { return escapeHtml(s); }

// ---- add dialog ----
const addDialog = document.getElementById("add-dialog");
const addForm = document.getElementById("add-form");

document.getElementById("add-btn").addEventListener("click", () => {
  // Prefill date = today, time = next full hour (local).
  const now = new Date();
  const next = new Date(now.getTime() + 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  document.getElementById("f-date").value =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  document.getElementById("f-time").value = `${pad(next.getHours())}:00`;
  addDialog.showModal();
  document.getElementById("f-title").focus();
});

document.getElementById("cancel-btn").addEventListener("click", () => addDialog.close());

document.getElementById("save-btn").addEventListener("click", async (ev) => {
  ev.preventDefault();
  const title = document.getElementById("f-title").value.trim();
  const date = document.getElementById("f-date").value; // "YYYY-MM-DD"
  const time = document.getElementById("f-time").value; // "HH:mm"
  if (!title || !date || !time) return;
  // Build a local-time Date, then send as UTC ISO.
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const local = new Date(y, mo - 1, d, hh, mm, 0, 0);
  if (isNaN(local.getTime())) return;
  const ok = await addEvent(title, local.getTime());
  if (ok) { addDialog.close(); addForm.reset(); await loadEvents(); }
});

// ---- delete + tz preview (event delegation) ----
const tzDialog = document.getElementById("tz-dialog");
const tzSelect = document.getElementById("tz-select");
const tzCity = document.getElementById("tz-city");
const tzResult = document.getElementById("tz-result");
let tzStartMs = null;

barsEl.addEventListener("click", (ev) => {
  const del = ev.target.closest(".del-btn");
  if (del) {
    const id = del.dataset.id;
    if (confirm(`Delete "${del.dataset.title}"?`)) deleteEvent(id);
    return;
  }
  const tz = ev.target.closest(".tz-btn");
  if (tz) openTzDialog(tz);
});

function openTzDialog(btn) {
  tzStartMs = parseInt(btn.dataset.start, 10);
  const last = localStorage.getItem(TZ_STORE_KEY) || "";
  tzCity.value = "";
  if (last) tzSelect.value = last;
  updateTzResult(last || tzSelect.value);
  tzDialog.showModal();
}

function resolveCity(name) {
  return CITY_TZ[name.trim().toLowerCase()] || null;
}

function updateTzResult(tz) {
  if (!tz || tzStartMs == null) { tzResult.textContent = ""; return; }
  tzResult.textContent = `${fmtLocal(tzStartMs, tz)} (${tz})`;
  localStorage.setItem(TZ_STORE_KEY, tz);
  tzSelect.value = tz;
}

document.getElementById("tz-go").addEventListener("click", () => {
  const tz = resolveCity(tzCity.value);
  if (tz) updateTzResult(tz);
  else tzResult.textContent = "City not found — pick from the list below.";
});
tzSelect.addEventListener("change", () => updateTzResult(tzSelect.value));
document.getElementById("tz-close").addEventListener("click", () => tzDialog.close());

// ---- init ----
function initTzDropdown() {
  let zones;
  try { zones = Intl.supportedValuesOf("timeZone"); }
  catch { zones = Object.values(CITY_TZ); }
  tzSelect.innerHTML = zones.map((z) => `<option value="${z}">${z}</option>`).join("");
  const last = localStorage.getItem(TZ_STORE_KEY);
  if (last) tzSelect.value = last;
}

// ---- hour format toggle ----
const fmtBtn = document.getElementById("fmt-btn");

function effectiveHour12() {
  if (hour12 !== undefined) return hour12;
  // Fall back to whatever the browser locale resolves to.
  return new Intl.DateTimeFormat(undefined, { hour: "numeric" })
    .resolvedOptions().hour12 === true;
}

function updateFmtLabel() {
  fmtBtn.textContent = effectiveHour12() ? "12H" : "24H";
}

fmtBtn.addEventListener("click", () => {
  hour12 = !effectiveHour12();
  localStorage.setItem(H12_STORE_KEY, hour12 ? "12" : "24");
  updateFmtLabel();
  render();
});

updateFmtLabel();
initTzDropdown();
loadEvents();
setInterval(tick, 1000);
