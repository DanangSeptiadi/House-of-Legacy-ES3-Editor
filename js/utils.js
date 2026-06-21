// ── Global state ─────────────────────────────────────────────────
let S = null,
  fileName = "GameData.es3";

// ── DOM shortcut ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── HTML escape ──────────────────────────────────────────────────
const esc = (s) =>
  String(s).replace(
    /[&<>]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[m],
  );

// ── Number clamping ──────────────────────────────────────────────
const clampStr = (v, lo, hi) => {
  let n = Number(v);
  if (isNaN(n)) n = lo;
  return String(Math.min(hi, Math.max(lo, n)));
};

// ── ID generation ────────────────────────────────────────────────
const randId = () =>
  "M" + ((Math.random() * 1e17) | 0) + Date.now().toString().slice(-6);

// ── Portrait default ─────────────────────────────────────────────
const defaultPortrait = "4|23|1|10";

// ── Pipe (|) field helpers ──────────────────────────────────────
const getPipe = (str, i, def = "") => {
  const p = (str || "").split("|");
  return i < p.length ? p[i] : def;
};
const setPipe = (str, i, val) => {
  const p = (str || "").split("|");
  while (p.length <= i) p.push("");
  p[i] = val;
  return p.join("|");
};

// ── F4 parsing / building ────────────────────────────────────────
const parseF4 = (str) => ({
  name: getPipe(str, 0, "Unknown"),
  gen: getPipe(str, 1, "0"),
  talentType: getPipe(str, 2, "1"),
  talentVal: getPipe(str, 3, "0"),
  gender: getPipe(str, 4, "0"),
  lifespan: getPipe(str, 5, "80"),
  skillType: getPipe(str, 6, "1"),
  luck: getPipe(str, 7, "50"),
  unk: getPipe(str, 8, ""),
  hobby: getPipe(str, 9, "0"),
});
const buildF4 = (o) =>
  `${o.name}|${o.gen}|${o.talentType}|${o.talentVal}|${o.gender}|${o.lifespan}|${o.skillType}|${o.luck}|${o.unk}|${o.hobby}`;
const buildF4R = (o) =>
  `${o.name}|${o.gen}|${o.talentType}|${o.talentVal}|${o.gender}|${o.lifespan}|${o.skillType}|${o.luck}|${o.unk}|${o.hobby}|null`;

// ── Spouse-specific f4 (12-field: partnerId at 9, hobby at 10) ────
const parseF4_S = (str) => ({
  name: getPipe(str, 0, "Unknown"),
  gen: getPipe(str, 1, "0"),
  talentType: getPipe(str, 2, "1"),
  talentVal: getPipe(str, 3, "0"),
  gender: getPipe(str, 4, "0"),
  lifespan: getPipe(str, 5, "80"),
  skillType: getPipe(str, 6, "1"),
  luck: getPipe(str, 7, "50"),
  unk: getPipe(str, 8, ""),
  partnerId: getPipe(str, 9, ""),
  hobby: getPipe(str, 10, "0"),
});
const buildF4_S = (o) =>
  `${o.name}|${o.gen}|${o.talentType}|${o.talentVal}|${o.gender}|${o.lifespan}|${o.skillType}|${o.luck}|${o.unk}|${o.partnerId}|${o.hobby}|null`;

// ── Table cell helpers ───────────────────────────────────────────
const td = (val, t, i, f, type = "text") =>
  `<td><input class="ii" type="${type}" data-t="${t}" data-i="${i}" data-f="${f}" value="${esc(val)}"></td>`;
const tds = (opts, cur, t, i, f) =>
  `<td><select class="ii" data-t="${t}" data-i="${i}" data-f="${f}">${Object.entries(
    opts,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}"${cur == k ? " selected" : ""}>${v}</option>`,
    )
    .join("")}</select></td>`;
const del = (t, i) =>
  `<td><button class="del" data-t="${t}" data-i="${i}">🗑️</button></td>`;

// ── Status bar ───────────────────────────────────────────────────
function setStatus(msg, ok = true) {
  const el = $("status");
  el.textContent = msg;
  el.style.background = ok ? "#2c5a4a" : "#8b3c2c";
  setTimeout(() => (el.style.background = "#2c444c"), 2000);
}
