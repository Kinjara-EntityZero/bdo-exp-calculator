const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString();
const KILLS_STORAGE_KEY = "bdoKillsPerHour";

function fmtTime(hours) {
  const totalMinutes = Math.round(hours * 60);
  const days = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  return days > 0 ? `${days}d ${h}h ${m}m` : `${h}h ${m}m`;
}

function capPercent(level) {
  return EXP_CAP_TABLE.find((row) => level <= row.maxLevel).percent;
}

function totalBuffPercent() {
  let total = Number($("customBuff").value) || 0;
  for (const buff of BUFFS) {
    if ($(`buff-${buff.id}`).checked) total += buff.percent;
  }
  return total;
}

// Saved kills per hour, keyed by zone id then mob name, so switching zones keeps your entries.
function loadSavedKills() {
  try {
    return JSON.parse(localStorage.getItem(KILLS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveKills(saved) {
  try {
    localStorage.setItem(KILLS_STORAGE_KEY, JSON.stringify(saved));
  } catch {}
}

const savedKills = loadSavedKills();

function currentZone() {
  return ZONES.find((z) => z.id === $("zone").value);
}

// Average base EXP of the zone's non-elite mobs.
function zoneAverageExp(zone) {
  const regulars = zone.mobs.filter((mob) => !mob.elite);
  return regulars.reduce((sum, mob) => sum + mob.exp, 0) / regulars.length;
}

// The mobs that make up an "average kill". With kills per hour entered, each mob is
// weighted by its kills; otherwise the zone's non-elite average counts as the only kill.
function killMix(zone) {
  const entered = zone.mobs
    .map((mob, i) => ({ exp: mob.exp, weight: Number($(`kills-${i}`).value) || 0 }))
    .filter((m) => m.weight > 0);
  return entered.length
    ? { mobs: entered, timed: true }
    : { mobs: [{ exp: zoneAverageExp(zone), weight: 1 }], timed: false };
}

// Walks level by level, carrying leftover EXP from the last kill into the next level.
// Each mob's buffed EXP is capped separately before averaging.
function calculate({ currentLevel, progress, targetLevel, mobs, buffPercent }) {
  const multiplier = 1 + buffPercent / 100;
  const totalWeight = mobs.reduce((sum, m) => sum + m.weight, 0);
  const lowestExp = Math.min(...mobs.map((m) => m.exp));
  const rows = [];
  const missing = [];
  let carry = 0;
  let totalKills = 0;

  for (let level = currentLevel; level < targetLevel; level++) {
    const required = LEVEL_EXP[level];
    if (required === undefined) {
      missing.push(level);
      rows.push({ level, missing: true });
      carry = 0;
      continue;
    }

    const capPct = capPercent(level);
    const cap = required * (capPct / 100);
    const perKill = mobs.reduce((sum, m) => sum + m.weight * Math.min(m.exp * multiplier, cap), 0) / totalWeight;
    const capped = mobs.some((m) => m.exp * multiplier > cap);
    const alreadyHave = level === currentLevel ? required * (progress / 100) : carry;
    const needed = Math.max(required - alreadyHave, 0);
    const kills = Math.ceil(needed / perKill);

    carry = kills * perKill - needed;
    totalKills += kills;
    // Buff % at which every mob in the mix reaches the cap: lowestExp * (1 + b/100) = cap.
    const buffToCap = Math.max((cap / lowestExp - 1) * 100, 0);

    rows.push({ level, required, capPct, cap, buffToCap, perKill, capped, kills });
  }

  return { rows, missing, totalKills };
}

function renderMobInputs() {
  const zone = currentZone();
  const saved = savedKills[zone.id] || {};
  $("mobRows").innerHTML = zone.mobs
    .map(
      (mob, i) => `<tr>
        <td>${mob.name}${mob.elite ? ' <span class="elite">Elite</span>' : ""}</td>
        <td>${fmt(mob.exp)}</td>
        <td><input id="kills-${i}" type="number" min="0" step="1" placeholder="0" value="${saved[mob.name] ?? ""}"></td>
        <td id="mobExp-${i}"></td>
        <td id="mobHour-${i}"></td>
      </tr>`
    )
    .join("");
}

function storeMobInputs() {
  const zone = currentZone();
  savedKills[zone.id] = Object.fromEntries(
    zone.mobs.map((mob, i) => [mob.name, $(`kills-${i}`).value]).filter(([, v]) => v !== "")
  );
  saveKills(savedKills);
}

// Fills in each mob's EXP per kill and EXP per hour at the current level.
function renderMobBreakdown(zone, currentLevel, buffPercent) {
  const required = LEVEL_EXP[currentLevel];
  const cap = required * (capPercent(currentLevel) / 100);
  const multiplier = 1 + buffPercent / 100;
  let totalKills = 0;
  let totalExp = 0;

  zone.mobs.forEach((mob, i) => {
    const perKill = Math.min(mob.exp * multiplier, cap);
    const kills = Number($(`kills-${i}`).value) || 0;
    totalKills += kills;
    totalExp += kills * perKill;
    $(`mobExp-${i}`).innerHTML = `${fmt(perKill)}${mob.exp * multiplier > cap ? " <em>capped</em>" : ""}`;
    $(`mobHour-${i}`).textContent = kills ? fmt(kills * perKill) : "";
  });

  $("mobTotals").innerHTML = totalKills
    ? `<tr><td>Total</td><td></td><td>${fmt(totalKills)}</td><td>${fmt(totalExp / totalKills)} avg</td><td>${fmt(totalExp)}</td></tr>`
    : "";
}

function render() {
  const currentLevel = Number($("currentLevel").value);
  const targetLevel = Number($("targetLevel").value);
  const zone = currentZone();
  const buffPercent = totalBuffPercent();
  const progress = Math.min(Math.max(Number($("progress").value) || 0, 0), 99.999);

  renderMobBreakdown(zone, currentLevel, buffPercent);

  if (targetLevel <= currentLevel) {
    $("summary").innerHTML = `<p class="warn">Target level must be higher than current level.</p>`;
    $("levels").innerHTML = "";
    return;
  }

  const mix = killMix(zone);
  const killsPerHour = mix.timed ? mix.mobs.reduce((sum, m) => sum + m.weight, 0) : 0;
  const result = calculate({ currentLevel, progress, targetLevel, mobs: mix.mobs, buffPercent });
  const first = result.rows.find((r) => !r.missing);

  const stats = [
    ["Total buffs", `+${buffPercent}%`],
    [mix.timed ? "Avg EXP / kill" : "EXP / kill", first ? fmt(first.perKill) : "—"],
    ["Total kills", fmt(result.totalKills)],
  ];
  if (mix.timed) {
    stats.push(["Kills / hour", fmt(killsPerHour)]);
    stats.push(["Estimated time", fmtTime(result.totalKills / killsPerHour)]);
  }

  let html = `<div class="stats">${stats
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("")}</div>`;
  if (!mix.timed) {
    html += `<p class="hint">Using the zone's average non-elite mob (${fmt(zoneAverageExp(zone))} base EXP). Enter kills per hour above for a weighted average and time estimate.</p>`;
  }
  if (result.missing.length) {
    html += `<p class="warn">EXP data missing for level${result.missing.length > 1 ? "s" : ""} ${result.missing.join(", ")}. Totals only include levels with known data.</p>`;
  }
  $("summary").innerHTML = html;

  $("levels").innerHTML = result.rows
    .map((r) =>
      r.missing
        ? `<tr class="missing"><td>${r.level} → ${r.level + 1}</td><td colspan="6">No EXP data yet</td></tr>`
        : `<tr>
            <td>${r.level} → ${r.level + 1}</td>
            <td>${fmt(r.required)}</td>
            <td>${r.capPct}% (${fmt(r.cap)})</td>
            <td>+${fmt(r.buffToCap)}%</td>
            <td>${fmt(r.perKill)}${r.capped ? " <em>capped</em>" : ""}</td>
            <td>${fmt(r.kills)}</td>
            <td>${mix.timed ? fmtTime(r.kills / killsPerHour) : "—"}</td>
          </tr>`
    )
    .join("");
}

function init() {
  // `dataLevel` maps an option's level to the level whose EXP data it depends on.
  const levelOptions = (from, to, dataLevel) =>
    Array.from({ length: to - from + 1 }, (_, i) => {
      const level = from + i;
      return `<option${LEVEL_EXP[dataLevel(level)] === undefined ? " disabled" : ""}>${level}</option>`;
    }).join("");

  $("currentLevel").innerHTML = levelOptions(1, MAX_LEVEL - 1, (level) => level);
  $("targetLevel").innerHTML = levelOptions(2, MAX_LEVEL, (level) => level - 1);
  $("currentLevel").value = 66;
  $("targetLevel").value = 67;

  $("zone").innerHTML = ZONES.map((z) => `<option value="${z.id}">Lv ${z.level} ${z.name}</option>`).join("");

  $("buffs").innerHTML = BUFFS.map(
    (b) => `<label class="buff"><input type="checkbox" id="buff-${b.id}"> ${b.name} <span>+${b.percent}%</span></label>`
  ).join("");

  $("currentLevel").addEventListener("change", () => {
    const current = Number($("currentLevel").value);
    if (Number($("targetLevel").value) <= current) $("targetLevel").value = current + 1;
  });
  $("zone").addEventListener("change", renderMobInputs);
  $("mobRows").addEventListener("input", storeMobInputs);

  document.querySelector(".inputs").addEventListener("input", render);
  document.querySelector(".inputs").addEventListener("change", render);
  renderMobInputs();
  render();
}

init();
