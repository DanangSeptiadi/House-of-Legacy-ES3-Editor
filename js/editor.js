// ── Data normalisation ──────────────────────────────────────────
function normalizeData() {
  if (!S) return;
  if (S.Member_now?.value) {
    S.Member_now.value.forEach((m) => {
      if (m[MI.examTitle] !== undefined && typeof m[MI.examTitle] !== "string")
        m[MI.examTitle] = String(m[MI.examTitle]);
      if (m[MI.school] !== undefined && typeof m[MI.school] !== "string")
        m[MI.school] = String(m[MI.school]);
    });
  }
}

// ── Field application (called on input change) ──────────────────
function applyField(row, type, field, rawVal) {
  const fk = F4_KEY[type];
  if (PIPE_FIELDS.has(field) && fk !== undefined) {
    let f = type === "spouse" ? parseF4_S(row[fk]) : parseF4(row[fk]);
    if (field === "name") f.name = rawVal;
    else if (field === "luck") f.luck = clampStr(rawVal, 0, 100);
    else if (field === "talentType") f.talentType = rawVal;
    else if (field === "talentVal") f.talentVal = clampStr(rawVal, 0, 100);
    else if (field === "skillType") f.skillType = rawVal;
    else if (field === "hobby") f.hobby = rawVal;
    else if (field === "gender") f.gender = rawVal;
    if (type === "spouse") row[fk] = buildF4_S(f);
    else if (isRet(type)) row[fk] = buildF4R(f);
    else row[fk] = buildF4(f);
    return;
  }
  if (field === "partnerId") {
    row[fk] = setPipe(row[fk], 9, rawVal);
    return;
  }
  if (field === "specialTag") {
    if (type === "spouse") row[SI.specialTag] = rawVal;
    else if (type === "retainer") row[RI.specialTag] = rawVal;
    return;
  }
  const spec = RAW[type]?.[field];
  if (spec) {
    const [idx, lo, hi] = spec;
    row[idx] = clampStr(rawVal, lo, hi);
    return;
  }
  if (type === "horse" || type === "inv") {
    row[+field] = rawVal;
  }
}

const RENDERS = {
  member: renderMembers,
  spouse: renderSpouses,
  retainer: renderRetainers,
  horse: renderHorses,
  inv: renderInventory,
};

// ── Event: field change (input / select) ──────────────────────────
document.addEventListener("change", (e) => {
  const t = e.target.dataset.t,
    i = e.target.dataset.i,
    f = e.target.dataset.f;
  if (!t || i === undefined || !f || !S) return;
  const src = DEL_KEY[t];
  if (src && S[src]?.value[+i])
    applyField(S[src].value[+i], t, f, e.target.value);
});

// ── Event: delete row ─────────────────────────────────────────────
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".del");
  if (!btn || !S) return;
  const { t, i } = btn.dataset;
  S[DEL_KEY[t]]?.value.splice(+i, 1);
  RENDERS[t]?.();
});

// ── Auto‑max helpers ──────────────────────────────────────────────
function autoMaxGame() {
  if (!S) return;
  if (!S.CGNum) S.CGNum = { value: ["0", "0", "0", "0"] };
  S.CGNum.value[0] = "999999999";
  S.CGNum.value[1] = "999999";
  if (S.FamilyData?.value) {
    S.FamilyData.value[2] = "80";
    S.FamilyData.value[3] = "1600";
  }
  renderGameData();
}

function autoMax(type) {
  if (!S) return;
  const STATS_100 = [
    "lit",
    "mar",
    "com",
    "art",
    "cunning",
    "rep",
    "health",
    "stamina",
    "mood",
    "charm",
  ];

  if (type === "member" && S.Member_now) {
    S.Member_now.value.forEach((m) => {
      STATS_100.forEach((k) => (m[MI[k]] = "100"));
      m[MI.age] = "21";
      m[MI.skillVal] = "100";
      m[MI.examTitle] = "9";
      m[MI.school] = "3";
      const f = parseF4(m[MI.f4]);
      f.luck = "100";
      f.talentVal = "100";
      m[MI.f4] = buildF4(f);
    });
    renderMembers();
  }

  if (type === "spouse" && S.Member_qu) {
    S.Member_qu.value.forEach((s) => {
      STATS_100.forEach((k) => (s[SI[k]] = "100"));
      s[SI.age] = "21";
      s[SI.skillVal] = "100";
      s[SI.relation] = "100";
      s[SI.f4] = setPipe(setPipe(s[SI.f4] || "", 7, "100"), 3, "100");
    });
    renderSpouses();
  }

  if (type === "retainer" && S.MenKe_Now) {
    S.MenKe_Now.value.forEach((r) => {
      STATS_100.forEach((k) => (r[RI[k]] = "100"));
      r[RI.age] = "21";
      r[RI.charm] = "100";
      r[RI.fee] = "0";
      const f = parseF4(r[RI.nl]);
      f.luck = "100";
      f.talentVal = "100";
      r[RI.nl] = buildF4R(f);
    });
    renderRetainers();
  }

  if (type === "horse" && S.Horse_Have) {
    S.Horse_Have.value = S.Horse_Have.value.map((h) => {
      while (h.length < 7) h.push("0");
      return [h[0] || "6", "5", "25", "99", "99", "99", h[6] || "null"];
    });
    renderHorses();
  }
}

// ── Add entry helpers ──────────────────────────────────────────────
function addRetainer() {
  if (!S.MenKe_Now) S.MenKe_Now = { value: [] };
  const r = new Array(22).fill("");
  r[RI.id] = randId();
  r[RI.portrait] = defaultPortrait;
  r[RI.nl] = "New Retainer|0|0|50|1|80|0|50|1|0|null";
  r[RI.age] = "21";
  r[RI.health] = "100";
  r[RI.stamina] = "100";
  r[RI.mood] = "50";
  [RI.rep, RI.charm, RI.lit, RI.mar, RI.com, RI.art, RI.cunning].forEach(
    (i) => (r[i] = "50"),
  );
  r[RI.fee] = "0";
  r[RI.specialTag] = "";
  r[RI.pregnancy] = "-1";
  S.MenKe_Now.value.push(r);
  renderRetainers();
}

function addHorse() {
  if (!S.Horse_Have) S.Horse_Have = { value: [] };
  S.Horse_Have.value.push(["6", "3", "25", "50", "50", "50", "null"]);
  renderHorses();
}

function addAllItems() {
  S.Prop_have = {
    __type:
      "System.Collections.Generic.List`1[[System.Collections.Generic.List`1[[System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]], mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]],mscorlib",
    value: [],
  };
  for (let id = 0; id <= 285; id++) {
    S.Prop_have.value.push([String(id), "999999"]);
  }
  renderInventory();
  setStatus("Added all items 0-285 quantity 999,999.");
}

function addItem() {
  if (!S.Prop_have) {
    S.Prop_have = {
      __type:
        "System.Collections.Generic.List`1[[System.Collections.Generic.List`1[[System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]], mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]],mscorlib",
      value: [],
    };
  }
  S.Prop_have.value.push(["0", "1"]);
  renderInventory();
}

// ── File loading ──────────────────────────────────────────────────
document.getElementById("fileInput").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      S = JSON.parse(ev.target.result);
      fileName = file.name;
      normalizeData();
      setStatus(`Loaded: ${file.name}`);
      renderAll();
    } catch (err) {
      setStatus("Invalid JSON: " + err.message, false);
    }
  };
  reader.readAsText(file);
};

// ── Flush game form back to S ──────────────────────────────────────
function flushGameData() {
  if (!S) return;
  if (!S.CGNum) S.CGNum = { value: ["0", "0", "0", "0"] };
  const gold = Number($("g_gold")?.value);
  const ingot = Number($("g_ingot")?.value);
  S.CGNum.value[0] = isNaN(gold) ? "0" : String(gold);
  S.CGNum.value[1] = isNaN(ingot) ? "0" : String(ingot);
  const fam = S.FamilyData?.value;
  if (fam) {
    fam[1] = $("g_fname")?.value || fam[1] || "Yu";
    fam[2] = String(Number($("g_flevel")?.value) || 1);
    fam[3] = String(Number($("g_frep")?.value) || 0);
  }
  const tm = S.Time_now?.value;
  if (tm) {
    tm[2] = Number($("g_year")?.value) || 0;
    tm[1] = Number($("g_month")?.value) || 0;
    tm[0] = Number($("g_day")?.value) || 0;
  }
}

// ── Save ───────────────────────────────────────────────────────────
function doSave() {
  if (!S) {
    setStatus("No save loaded", false);
    return;
  }
  flushGameData();
  normalizeData();
  const blob = new Blob([JSON.stringify(S, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus("Saved.");
}
