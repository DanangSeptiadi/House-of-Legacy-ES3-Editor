#!/usr/bin/env node
// ── House of Legacy · local save server ───────────────────────────
// Zero-dependency static server + live GameData.es3 bridge.
//
//   node serve.mjs
//   HOL_SAVE="/path/to/GameData.es3" node serve.mjs
//   node serve.mjs --save "/path/to/GameData.es3" --port 4173
//   node serve.mjs --print-save        # print the auto-detected path
//
// The editor auto-detects this server, loads the save on startup, watches
// it for changes (game writes), and saves directly back to disk.

import { createServer } from "node:http";
import {
  copyFile,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { existsSync, readdirSync, statSync, watch } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const APP_ID = "house-of-legacy-save-server";
const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(cliValue("--port") || process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_BODY = 64 * 1024 * 1024;

// ── Locate the save file ──────────────────────────────────────────
function cliValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function expand(p) {
  return resolve(p.replace(/^~(?=$|[\\/])/, homedir()));
}

// Steam can live in a few places depending on distro / Flatpak.
function steamRoots() {
  const candidates = [
    process.env.STEAM_DIR,
    join(homedir(), ".local/share/Steam"),
    join(homedir(), ".steam/steam"),
    join(homedir(), ".var/app/com.valvesoftware.Steam/.local/share/Steam"),
  ].filter(Boolean);
  return [...new Set(candidates.map(expand))];
}

function findSaveFile() {
  const explicit = cliValue("--save") || process.env.HOL_SAVE;
  if (explicit) return { path: expand(explicit), auto: false };

  const saves = [];
  for (const steam of steamRoots()) {
    const s3 = join(
      steam,
      "steamapps/compatdata/2503770/pfx/drive_c/users/steamuser",
      "AppData/LocalLow/S3Studio/House of Legacy",
    );
    const fw = join(s3, "FW");
    if (!existsSync(fw)) continue;
    try {
      for (const slot of readdirSync(fw)) {
        const p = join(fw, slot, "GameData.es3");
        if (existsSync(p)) saves.push({ path: p, mtime: statSync(p).mtimeMs });
      }
    } catch {
      /* unreadable Steam prefix – skip */
    }
  }
  // Most recently played slot wins.
  saves.sort((a, b) => b.mtime - a.mtime);
  if (saves.length) return { path: saves[0].path, auto: true };

  // Nothing found yet: still start, using the conventional slot path.
  const fallback = join(
    steamRoots()[0] || join(homedir(), ".local/share/Steam"),
    "steamapps/compatdata/2503770/pfx/drive_c/users/steamuser",
    "AppData/LocalLow/S3Studio/House of Legacy/FW/0/GameData.es3",
  );
  return { path: fallback, auto: true };
}

const saveInfo = findSaveFile();
const SAVE = saveInfo.path;
const SAVE_DIR = dirname(SAVE);
const SAVE_NAME = SAVE.split(sep).pop();

// `make save-path` / scripting helper.
if (process.argv.includes("--print-save")) {
  console.log(SAVE);
  process.exit(0);
}

let last = { mtime: 0, size: -1 };

async function saveMeta() {
  try {
    const st = await stat(SAVE);
    return { exists: true, mtime: st.mtimeMs, size: st.size };
  } catch {
    return { exists: false, mtime: 0, size: -1 };
  }
}

// ── SSE clients ───────────────────────────────────────────────────
const clients = new Set();

function broadcast(event, data) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(frame);
    } catch {
      clients.delete(res);
    }
  }
}

let checking = false;
async function checkForChange() {
  if (checking) return;
  checking = true;
  try {
    const meta = await saveMeta();
    if (meta.exists && (meta.mtime !== last.mtime || meta.size !== last.size)) {
      last = { mtime: meta.mtime, size: meta.size };
      broadcast("change", meta);
    }
  } finally {
    checking = false;
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const json = (res, code, body) => {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

// ── API ───────────────────────────────────────────────────────────
async function handleApi(req, res, pathname) {
  if (pathname === "/api/health") {
    return json(res, 200, { app: APP_ID, save: SAVE });
  }

  if (pathname === "/api/save/meta") {
    const meta = await saveMeta();
    return json(res, 200, {
      app: APP_ID,
      name: SAVE_NAME,
      path: SAVE,
      ...meta,
    });
  }

  if (pathname === "/api/save" && req.method === "GET") {
    try {
      const text = await readFile(SAVE, "utf8");
      const st = await stat(SAVE);
      last = { mtime: st.mtimeMs, size: st.size };
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Save-Mtime": String(st.mtimeMs),
        "X-Save-Size": String(st.size),
      });
      res.end(text);
    } catch {
      json(res, 404, { error: "Save file not found", path: SAVE });
    }
    return;
  }

  if (pathname === "/api/save" && req.method === "PUT") {
    let body;
    try {
      body = await readBody(req);
    } catch (err) {
      return json(res, 413, { error: err.message });
    }
    try {
      JSON.parse(body); // never write a corrupt save
    } catch (err) {
      return json(res, 400, { error: "Invalid JSON: " + err.message });
    }

    try {
      const backup = SAVE + ".bak";
      if (existsSync(SAVE)) await copyFile(SAVE, backup).catch(() => {});
      const tmp = `${SAVE}.tmp-${process.pid}`;
      await writeFile(tmp, body, "utf8");
      await rename(tmp, SAVE);
      const st = await stat(SAVE);
      last = { mtime: st.mtimeMs, size: st.size };
      const meta = { exists: true, mtime: st.mtimeMs, size: st.size };
      broadcast("change", meta);
      console.log(`[save] wrote ${SAVE} (backup: ${SAVE_NAME}.bak)`);
      return json(res, 200, { app: APP_ID, name: SAVE_NAME, path: SAVE, ...meta });
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  }

  if (pathname === "/api/save/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`retry: 2000\n\n`);
    res.write(`event: ready\ndata: ${JSON.stringify(await saveMeta())}\n\n`);
    clients.add(res);
    const keepAlive = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        /* closed */
      }
    }, 20000);
    req.on("close", () => {
      clearInterval(keepAlive);
      clients.delete(res);
    });
    return;
  }

  json(res, 404, { error: "Unknown API endpoint" });
}

// ── Static files ──────────────────────────────────────────────────
async function handleStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return json(res, 400, { error: "Bad path" });
  }
  if (rel === "/") rel = "/index.html";

  const file = resolve(ROOT, "." + rel);
  const inside = file === ROOT || file.startsWith(ROOT + sep);
  const relPath = file === ROOT ? "" : file.slice(ROOT.length + 1);
  const parts = relPath.split(sep);
  const blocked =
    !inside ||
    parts.some((p) => p.startsWith(".")) ||
    parts[0] === "data" ||
    parts[0] === "node_modules" ||
    relPath === "serve.mjs";
  if (blocked) return json(res, 404, { error: "Not found" });

  try {
    const st = await stat(file);
    if (!st.isFile()) return json(res, 404, { error: "Not found" });
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file)] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    json(res, 404, { error: "Not found" });
  }
}

// ── Server ────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  try {
    if (pathname.startsWith("/api/")) return await handleApi(req, res, pathname);
    return await handleStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, 500, { error: "Internal error" });
    else res.end();
  }
});

async function watchSave() {
  // inotify watcher for instant updates…
  try {
    if (existsSync(SAVE_DIR)) {
      watch(SAVE_DIR, (_event, filename) => {
        if (!filename || filename.toString() === SAVE_NAME) checkForChange();
      }).on("error", () => {});
    }
  } catch {
    /* polling still covers it */
  }
  // …plus polling as a safety net (Proton/NTFS quirks, atomic replaces).
  setInterval(checkForChange, 1000).unref();
}

server.listen(PORT, HOST, async () => {
  const meta = await saveMeta();
  if (meta.exists) last = { mtime: meta.mtime, size: meta.size };
  await watchSave();
  const url = `http://${HOST}:${PORT}/`;
  console.log(`\n🏮 House of Legacy save server`);
  console.log(`   Editor : ${url}`);
  console.log(`   Save   : ${SAVE}`);
  if (!existsSync(SAVE)) {
    console.log(`   ⚠  Save not found yet – waiting for the game to create it.`);
  }
  if (saveInfo.auto) console.log(`   (auto-detected; override with HOL_SAVE=...)`);
  console.log(`\n   Open the editor and it will load + watch the file automatically.\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE")
    console.error(`Port ${PORT} is in use. Try: node serve.mjs --port 4174`);
  else console.error(err);
  process.exit(1);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    for (const res of clients) res.end();
    server.close(() => process.exit(0));
  });
}
