// ── Live save sync (optional local serve.mjs) ────────────────────
// When the page is served by `node serve.mjs`, the save is loaded from the
// real GameData.es3 on startup, watched for changes, and saved straight back.
// On a static host (Vercel/GitHub Pages) this quietly does nothing.

const liveState = {
  active: false,
  expectedMtime: 0,
  source: null,
  saving: false,
  reloading: false,
  path: "",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function setLiveUi(on) {
  $("reloadBtn")?.classList.toggle("hidden", !on);
  $("watchWrap")?.classList.toggle("hidden", !on);
  document.body.classList.toggle("live", on);
}

async function initLive() {
  let info;
  try {
    const res = await fetch("api/health", { cache: "no-store" });
    if (!res.ok) return;
    info = await res.json();
  } catch {
    return; // static hosting or file:// – normal manual mode
  }
  if (info?.app !== "house-of-legacy-save-server") return;

  liveState.active = true;
  liveState.path = info.save || "";
  setLiveUi(true);
  try {
    await loadLiveSave(true);
  } catch (err) {
    // Keep watching: the game may still be creating the file.
    setStatus("Live server found, but save read failed", false);
    console.error(err);
  }
  connectLive();
}

async function loadLiveSave(announce = true) {
  if (liveState.reloading) return;
  liveState.reloading = true;
  try {
    let data = null;
    let error = null;
    let mtime = 0;
    // The game may be mid-write; retry a few times on a short/partial file.
    for (let attempt = 0; attempt < 4 && !data; attempt++) {
      const res = await fetch("api/save", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      mtime = Number(res.headers.get("X-Save-Mtime")) || 0;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (err) {
        error = err;
        await sleep(300);
      }
    }
    if (!data) throw error || new Error("Empty save file");

    S = data;
    fileName = "GameData.es3";
    liveState.expectedMtime = mtime;
    normalizeData();
    renderAll();
    if (announce) setStatus("Live: GameData.es3");
  } finally {
    liveState.reloading = false;
  }
}

function connectLive() {
  const es = new EventSource("api/save/events");
  liveState.source = es;

  // Also covers reconnects: if the save changed while we were offline,
  // the server's current mtime won't match the one we loaded.
  es.addEventListener("ready", (e) => {
    try {
      handleLiveChange(JSON.parse(e.data));
    } catch {
      /* ignore */
    }
  });

  es.addEventListener("change", (e) => {
    try {
      handleLiveChange(JSON.parse(e.data));
    } catch {
      /* ignore */
    }
  });
}

async function handleLiveChange(meta) {
  if (!meta?.exists) return;
  if (meta.mtime === liveState.expectedMtime) return;
  if (liveState.saving) return; // our own direct save

  if (!$("autoReload")?.checked) {
    setStatus("Save changed on disk — click Reload", false);
    return;
  }
  try {
    await loadLiveSave(false);
    setStatus("Auto-reloaded from disk");
  } catch (err) {
    setStatus("Auto-reload failed: " + err.message, false);
  }
}

// Used by doSave() in editor.js. true = written, false = failed,
// null = live mode is off.
async function saveToLiveFile(text) {
  if (!liveState.active) return null;
  liveState.saving = true;
  try {
    const res = await fetch("api/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: text,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const meta = await res.json();
    liveState.expectedMtime = meta.mtime;
    setStatus(`Saved directly to GameData.es3 (.bak backup)`);
    return true;
  } catch (err) {
    setStatus("Direct save failed: " + err.message, false);
    return false;
  } finally {
    liveState.saving = false;
  }
}

function reloadFromFile() {
  if (!liveState.active) return;
  loadLiveSave(true).catch((err) =>
    setStatus("Reload failed: " + err.message, false),
  );
}

// A manually opened file must not be silently overwritten by the watcher.
function detachLive() {
  if (!liveState.active) return;
  liveState.active = false;
  liveState.source?.close();
  liveState.source = null;
  setLiveUi(false);
}

initLive();
