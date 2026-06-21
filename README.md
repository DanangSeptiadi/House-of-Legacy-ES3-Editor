# House of Legacy ES3 Save File Editor
- [Click Here!](https://house-of-legacy-es3.vercel.app/)
- A standalone HTML/JavaScript editor for **GameData.es3** save files of *House of Legacy*.
- No server required, works entirely in your browser.
- **Fork of** [Ada9digit/House-of-Legacy-ES3-Editor](https://github.com/Ada9digit/House-of-Legacy-ES3-Editor) — refactored into separate files for easier maintenance.

## The References
- [Save Editing Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3482191362)
- [Item ID](https://steamcommunity.com/sharedfiles/filedetails/?id=3528502862)
- [Using the Save Editing tool](https://steamcommunity.com/sharedfiles/filedetails/?id=3494698130)


## ✨ Features

| Feature | Status |
|---------|--------|
| Edit gold, ingots, family data | ✅ Yes |
| Edit member stats (age, lit, mar, etc.) | ✅ Yes |
| Edit spouse stats (safe fields only) | ✅ Yes |
| Edit retainer stats | ✅ Yes |
| Edit inventory (add/delete items) | ✅ Yes |
| Edit horses | ✅ Yes |
| Auto‑max members, spouses, retainers, horses | ✅ Yes (safe fields only) |
| Add new retainers | ✅ Yes |
| Add new spouses | ❌ Removed (caused missing family links, broken portraits, and ID randomizer issues) |
| Validate horse owner IDs | ❌ No |
| Fix existing pregnancy/fertility issues | ❌ No (must edit manually) |
| Real‑time validation | ❌ No |
| Server storage / sharing | ❌ No (static local file only) |

## 🚀 How to Use

1. Download the HTML file (or host it on GitHub Pages / Netlify).
2. Open it in any modern browser.
3. Click **📂 Open GameData.es3** and select your save file.
4. Edit any field – changes are applied live to the in‑memory data.
5. Click **💾 Save Archive** to download the modified `GameData.es3`.
6. Replace your original save file (make a backup first!).

## ⚠️ Important Notes

- **All numeric values are stored as strings** inside the JSON (except `Time_now` which remains integers – game expects that).
- **Auto‑max never touches** pregnancy, fertility, events, or duties – only safe stats.
- **Adding new spouses is disabled** because it caused missing family connections and broken portraits.
- **Item IDs 0–285 are added as‑is** (many IDs have no actual item; the game usually ignores them safely).
- **Horse owner IDs are not validated** – make sure you enter a valid member ID (e.g., `M0`).

## 🛠️ Technical Details

- Written in plain HTML/CSS/JS – no build step.
- Uses the ES3 JSON format exactly as the game exports it.
- All changes are client‑side; no data is sent to any server.

### f4 / nl Pipe‑format Handling

This fork fixes structural issues with the pipe‑delimited fields (`f4` for members/spouses, `nl` for retainers) that the original editor did not handle correctly. These fixes are based on analysis of save files from **game version 0.9.03**:

| Entity | Pipe‑count | Fix |
|--------|-----------|-----|
| **Member** (`f4`) | 10 fields | Unchanged – `parseF4`/`buildF4` correct from the start |
| **Spouse** (`f4`) | **12** fields | Added `parseF4_S`/`buildF4_S` – `partnerId` at pipe[9], `hobby` at pipe[10]. Previously hobby and partnerId shared the same pipe index, causing them to overwrite each other. The trailing `null` is also preserved instead of being truncated. |
| **Retainer** (`nl`) | 10–11 fields | `buildF4R` now preserves actual values for `gen`, `lifespan`, `unk`, and `hobby` instead of silently overwriting them with hardcoded defaults (`0`, `80`, `1`, `0`). |

The save format was verified against two different in‑game save files (`GameData.es3` and `GameData error.es3`) to confirm the correct field layout.

## 📁 File Structure

The editor expects a `GameData.es3` file containing a JSON object with the following top‑level keys:
- `CGNum` – gold & ingots
- `FamilyData` – clan info
- `Time_now` – year/month/day
- `Member_now` – player clan members
- `Member_qu` – spouses/concubines
- `MenKe_Now` – retainers
- `Prop_have` – inventory
- `Horse_Have` – horses

(Other keys are preserved but not edited.)

## 📄 License

Free to use, modify, and share. No warranty – always backup your saves!

---

*Vibe‑coded with ❤️ for the House of Legacy community.*
