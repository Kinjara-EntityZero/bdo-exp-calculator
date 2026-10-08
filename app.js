const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString();

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

// Walks level by level, carrying leftover EXP from the last kill into the next level.
function calculate({ currentLevel, progress, targetLevel, baseExp, buffPercent }) {
  const buffedExp = baseExp * (1 + buffPercent / 100);
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
    const perKill = Math.min(buffedExp, cap);
    const alreadyHave = level === currentLevel ? required * (progress / 100) : carry;
    const needed = Math.max(required - alreadyHave, 0);
    const kills = Math.ceil(needed / perKill);

    carry = kills * perKill - needed;
    totalKills += kills;
    // Buff % at which base EXP reaches the cap: base * (1 + b/100) = cap.
    const buffToCap = Math.max((cap / baseExp - 1) * 100, 0);

    rows.push({ level, required, capPct, cap, buffToCap, perKill, capped: buffedExp > cap, kills });
  }

  return { buffedExp, rows, missing, totalKills };
}

function render() {
  const currentLevel = Number($("currentLevel").value);
  const targetLevel = Number($("targetLevel").value);
  const zone = ZONES.find((z) => z.id === $("zone").value);
  const buffPercent = totalBuffPercent();
  const progress = Math.min(Math.max(Number($("progress").value) || 0, 0), 99.999);
  const killsPerHour = Number($("killsPerHour").value) || 0;

  if (targetLevel <= currentLevel) {
    $("summary").innerHTML = `<p class="warn">Target level must be higher than current level.</p>`;
    $("levels").innerHTML = "";
    return;
  }

  const result = calculate({ currentLevel, progress, targetLevel, baseExp: zone.expPerMob, buffPercent });

  const stats = [
    ["Base EXP / kill", fmt(zone.expPerMob)],
    ["Total buffs", `+${buffPercent}%`],
    ["Buffed EXP / kill", fmt(result.buffedExp)],
    ["Total kills", fmt(result.totalKills)],
  ];
  if (killsPerHour > 0) {
    const hours = result.totalKills / killsPerHour;
    stats.push(["Estimated time", `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`]);
  }

  let html = `<div class="stats">${stats
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("")}</div>`;
  if (result.missing.length) {
    html += `<p class="warn">EXP data missing for level${result.missing.length > 1 ? "s" : ""} ${result.missing.join(", ")}. Total kills only includes levels with known data.</p>`;
  }
  $("summary").innerHTML = html;

  $("levels").innerHTML = result.rows
    .map((r) =>
      r.missing
        ? `<tr class="missing"><td>${r.level} → ${r.level + 1}</td><td colspan="5">No EXP data yet</td></tr>`
        : `<tr${r.capped ? ' class="capped"' : ""}>
            <td>${r.level} → ${r.level + 1}</td>
            <td>${fmt(r.required)}</td>
            <td>${r.capPct}% (${fmt(r.cap)})</td>
            <td>+${fmt(r.buffToCap)}%</td>
            <td>${fmt(r.perKill)}${r.capped ? " <em>capped</em>" : ""}</td>
            <td>${fmt(r.kills)}</td>
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

  $("zone").innerHTML = ZONES.map((z) => `<option value="${z.id}">${z.name}</option>`).join("");

  $("buffs").innerHTML = BUFFS.map(
    (b) => `<label class="buff"><input type="checkbox" id="buff-${b.id}"> ${b.name} <span>+${b.percent}%</span></label>`
  ).join("");

  $("currentLevel").addEventListener("change", () => {
    const current = Number($("currentLevel").value);
    if (Number($("targetLevel").value) <= current) $("targetLevel").value = current + 1;
  });

  document.querySelector(".inputs").addEventListener("input", render);
  document.querySelector(".inputs").addEventListener("change", render);
  render();
}

init();
