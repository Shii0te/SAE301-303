// module/VizManager.js
let genreChart = null;
let genreInterval = null;
let profilChart = null;
export const VizManager = {
  renderComparatif(selector, payload) {
    const fiche = document.querySelector(".fiche-master");
    if (!fiche) return;

    // ===== FICHE =====
    fiche.querySelector("#nom-master").textContent =
      payload?.identite?.discipline || "—";
    fiche.querySelector("#infos").textContent =
      payload?.identite?.etablissement || "—";
    fiche.querySelector("#mention").textContent =
      payload?.identite?.mention || "—";
    setSelectedRegionFromData(payload?.identite?.region);


    // ===== CAROUSEL INIT =====
    initStatsSliderAuto();

    let currentYear = 2024;

    const toNum = (v) => {
      if (v === null || v === undefined) return 0;
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    function getYearData(year) {
      const y = payload?.annees?.[String(year)]?.stats || {};
      // pour l’instant: fallback sur candidatures (ton API actuelle)
      return y.pp || y.candidatures || null;
    }

    function normalizeStats(s) {
      if (!s) return null;

      return {
        // présents chez toi actuellement
        n_can: toNum(s.n_can),
        n_prop: toNum(s.n_prop),
        n_acc: toNum(s.n_acc),
        rang_dernier: toNum(s.rang_dernier),

        // à venir côté backend (sinon = null => ND)
        n_clas: ("n_clas" in s) ? toNum(s.n_clas) : null,
        n_acc_femme: ("n_acc_femme" in s) ? toNum(s.n_acc_femme) : null,
        pct_acc_acad: ("pct_acc_acad" in s) ? toNum(s.pct_acc_acad) : null,
        pct_acc_reg: ("pct_acc_reg" in s) ? toNum(s.pct_acc_reg) : null,
        profil_confirmes: s.profil_confirmes || null,
      };
    }

    function renderAll() {
      const raw = getYearData(currentYear);
      const d = normalizeStats(raw);
      if (!d) {
        console.warn("Aucune donnée stats pour", currentYear, payload);
        return;
      }

      renderChancePP(d, currentYear);      // Slide 1 ✅ fonctionne déjà
      renderGenrePP(d, currentYear);       // Slide 2 (ND si backend pas prêt)
      renderMobilitePP(d, currentYear);    // Slide 3 (ND si backend pas prêt)
      renderProfilPP(d, currentYear);      // Slide 4 (ND si backend pas prêt)
      renderSimilarMasters(payload);
      renderDetailsPP(d, currentYear);
      renderFormationLocation(payload);

    }

    // ===== TOGGLE ANNÉE =====
    document.querySelectorAll(".stats-switch--global [data-year]").forEach((btn) => {
      btn.onclick = () => {
        currentYear = Number(btn.dataset.year);

        document
          .querySelectorAll(".stats-switch--global [data-year]")
          .forEach((b) => b.classList.remove("active"));

        document
          .querySelectorAll(`.stats-switch--global [data-year="${currentYear}"]`)
          .forEach((b) => b.classList.add("active"));

        renderAll();
      };
    });

    renderAll();

    // ===== MONMASTER =====
    const params = new URLSearchParams(window.location.search);
    const formationId = params.get("id");
    const btn = document.getElementById("btn-monmaster");
    if (btn) {
      btn.onclick = () => {
        if (!formationId) return alert("Aucun id dans l’URL.");
        window.open(
          `https://monmaster.gouv.fr/formation?rechercheBrut=${encodeURIComponent(formationId)}`,
          "_blank"
        );
      };
    }
  },
  renderAdmissionDetails(admission) {
    console.log("Admission MonMaster reçue :", admission);

    const section = document.getElementById("admission-details");
    if (!section) {
      console.warn("Section #admission-details introuvable");
      return;
    }

    section.style.display = "block";

    // ✅ NORMALISATION ICI
    const { attendus, criteres, criteresExamen } =
      extractAdmissionData(admission);

    fillAdmissionList("admission-attendus", attendus);
    fillAdmissionList("admission-criteres", criteres);
    fillAdmissionList("admission-modalites", criteresExamen);

    console.log("Attendus:", attendus.length);
    console.log("Critères:", criteres.length);
    console.log("Modalités:", criteresExamen.length);

  }



};
// VizManager.js

function extractAdmissionData(admission) {
  let attendus = [];
  let criteres = [];
  let criteresExamen = [];

  // Cas 1 : données au niveau racine
  if (admission.attendus || admission.criteres || admission.criteresExamen) {
    attendus = admission.attendus || [];
    criteres = admission.criteres || [];
    criteresExamen = admission.criteresExamen || [];
  }

  // Cas 2 : données dans les parcours
  if (Array.isArray(admission.s1Parcours) && admission.s1Parcours.length > 0) {
    admission.s1Parcours.forEach(p => {
      if (Array.isArray(p.attendus)) attendus.push(...p.attendus);
      if (Array.isArray(p.criteres)) criteres.push(...p.criteres);
      if (Array.isArray(p.criteresExamen)) criteresExamen.push(...p.criteresExamen);
    });
  }

  return {
    attendus: [...new Set(attendus)],
    criteres: [...new Set(criteres)],
    criteresExamen: [...new Set(criteresExamen)]
  };
}

function renderList(selector, items) {
  const container = document.querySelector(selector);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = "<p class='acc-empty'>Information non communiquée</p>";
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "acc-list";

  items.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}


// =============================================================================
// FORMAT
// =============================================================================
function kpiChip(label, value) {
  return `<div class="kpi-chip"><span>${label}</span><strong>${value}</strong></div>`;
}

function fmtInt(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("fr-FR") : "—";
}

function fmtPct(p) {
  if (!Number.isFinite(p)) return "—";
  return `${Math.round(p)}%`;
}

// =============================================================================
// SLIDE 1 — CHANCE D’ADMISSION (PP)
// =============================================================================
function renderChancePP(d, year) {
  const box = document.getElementById("kpis-chance");
  const insight = document.getElementById("insight-chance");

  const confirms = Number(d.n_can || 0);
  const accepts = Number(d.n_acc || 0);
  const pct = confirms ? (accepts / confirms) * 100 : 0;

  if (box) {
    box.innerHTML = [
      kpiChip("Confirmés (PP)", fmtInt(confirms)),
      kpiChip("Acceptés (PP)", fmtInt(accepts)),
      kpiChip("Taux final", confirms ? fmtPct(pct) : "—"),
    ].join("");
  }

  updateGauge(pct, `Taux d’admission : ${confirms ? fmtPct(pct) : "—"}`);

  if (insight) {
    if (!confirms) insight.textContent = "Données indisponibles.";
    else insight.textContent = `En PP, ${Math.round(pct)}% des candidats confirmés ont été admis.`;
  }
}

// =============================================================================
// SLIDE 2 — FEMMES / HOMMES (PP)
// =============================================================================

function renderGenrePP(d, year) {
  const box = document.getElementById("kpis-genre");
  const root = document.getElementById("genre");
  const insight = document.getElementById("insight-genre");
  if (!root) return;

  const total = Number(d.n_acc || 0);
  const femmes =
    d.n_acc_femme === null || d.n_acc_femme === undefined
      ? null
      : Number(d.n_acc_femme || 0);

  // ND clair
  if (!total || femmes === null) {
    if (box) {
      box.innerHTML = [
        kpiChip("Total", fmtInt(total)),
        kpiChip("Femmes", "ND"),
        kpiChip("Hommes", "ND"),
      ].join("");
    }
    root.innerHTML = `<p style="text-align:center;font-weight:700;color:#444;">Données femmes (acceptés) indisponibles.</p>`;
    if (insight) insight.textContent = "";
    if (genreChart) { genreChart.dispose(); genreChart = null; }
    if (genreInterval) { clearInterval(genreInterval); genreInterval = null; }
    return;
  }

  const hommes = Math.max(0, total - femmes);
  const partFemmes = total ? (femmes / total) * 100 : 0;

  // KPI : Total / Femmes / Hommes
  if (box) {
    box.innerHTML = [
      kpiChip("Total", fmtInt(total)),
      kpiChip("Femmes", fmtInt(femmes)),
      kpiChip("Hommes", fmtInt(hommes)),
    ].join("");
  }

  // Reset chart
  if (genreChart) genreChart.dispose();
  genreChart = echarts.init(root);

  const symbol = "image:///images/bonhomme.svg";
  const lineCount = 3;

  function makeBushData(value, negative = false) {
    const MAX_VISUAL = 120;
    const visualValue = Math.min(value, MAX_VISUAL);
    const ratio = MAX_VISUAL ? visualValue / MAX_VISUAL : 0;

    const r = Math.max(6, ratio * 300);
    const arr = [];

    for (let i = 0; i < lineCount; i++) {
      const dome = (lineCount - Math.abs(i - lineCount / 2 + 0.5)) * r;
      const sign = negative ? -1 : 1;

      arr.push({
        value: dome * sign * (i % 3 === 0 ? 1 : 0.9),
        symbolOffset: i % 2 ? ["50%", 0] : undefined
      });
    }
    return arr;
  }

  const modes = [
    { key: "complet", label: "acceptés", value: total, noun: "acceptés" },
    { key: "femmes", label: "femmes acceptées", value: femmes, noun: "femmes acceptées" },
    { key: "hommes", label: "hommes acceptés", value: hommes, noun: "hommes acceptés" },
  ];

  let modeIndex = 0;

  function parityText() {
    if (partFemmes >= 55) return "Majorité de femmes parmi les acceptés.";
    if (partFemmes <= 45) return "Majorité d’hommes parmi les acceptés.";
    return "Répartition proche de la parité.";
  }

  function viewText(mode) {
    // "Vue : X femmes acceptées." / "Vue : X hommes acceptés." / "Vue : X acceptés."
    if (mode.key === "complet") return `${total} acceptés. ${parityText()}`;
    if (mode.key === "femmes") return `${femmes} femmes acceptées. ${parityText()}`;
    return `${hommes} hommes acceptés. ${parityText()}`;
  }

  function getOption(mode) {
    const pos = makeBushData(mode.value);
    const neg = makeBushData(mode.value, true);

    const maxAbs = Math.max(1, ...pos.map(o => Math.abs(o.value)));
    const ax = Math.max(600, Math.ceil(maxAbs * 1.25));

    return {
      xAxis: { type: "value", show: false, min: -ax, max: ax },
      yAxis: {
        type: "category",
        data: Array.from({ length: lineCount }, (_, i) => i),
        show: false
      },
      grid: { top: 20, bottom: 20, left: 10, right: 10 },

      series: [
        { type: "pictorialBar", symbol, symbolSize: [30, 55], symbolRepeat: true, data: pos },
        { type: "pictorialBar", symbol, symbolSize: [30, 55], symbolRepeat: true, data: neg }
      ]
    };
  }


  function update() {
    const mode = modes[modeIndex];
    genreChart.setOption(getOption(mode), true);

    if (insight) insight.textContent = viewText(mode); // ✅ ici (à la place de "Majorité...")
  }


  if (genreInterval) clearInterval(genreInterval);
  genreInterval = setInterval(() => {
    modeIndex = (modeIndex + 1) % modes.length;
    update();
  }, 3000);

  update();

  if (!root.dataset.resizeBound) {
    window.addEventListener("resize", () => genreChart && genreChart.resize());
    root.dataset.resizeBound = "1";
  }
}


// =============================================================================
// SLIDE 3 — LOCAL / MOBILITÉ (PP)
// =============================================================================
function renderMobilitePP(d, year) {
  const box = document.getElementById("kpis-mobilite");
  const root = document.getElementById("mobilite");
  const insight = document.getElementById("insight-mobilite");

  const rawAcad = d.pct_acc_acad; // null => ND
  const rawReg = d.pct_acc_reg;

  const acad = (rawAcad === null) ? null : (rawAcad <= 1 ? rawAcad * 100 : rawAcad);
  const reg = (rawReg === null) ? null : (rawReg <= 1 ? rawReg * 100 : rawReg);

  if (box) {
    box.innerHTML = [
      kpiChip("Même académie", acad === null ? "ND" : fmtPct(acad)),
      kpiChip("Même région", reg === null ? "ND" : fmtPct(reg)),
      kpiChip("Base", "Acceptés (PP)"),
    ].join("");
  }

  if (root) {
    root.innerHTML = `
      <div class="mob">
        ${progressRow("Même académie", acad)}
        ${progressRow("Même région académique", reg)}
      </div>
    `;
  }

  if (insight) {
    if (acad === null && reg === null) insight.textContent = "Données de mobilité non disponibles pour cette année.";
    else if ((reg ?? 0) >= 70) insight.textContent = "Recrutement plutôt local à l’échelle régionale.";
    else insight.textContent = "Mobilité notable : une part importante vient d’autres régions.";
  }
}

// =============================================================================
// SLIDE 4 — PROFIL (OPTION)
// =============================================================================
function renderProfilPP(d, year) {
  const box = document.getElementById("kpis-profil");
  const root = document.getElementById("profil-chart");
  const insight = document.getElementById("insight-profil");

  const p = d.profil_confirmes;

  // ND
  if (!p || !root) {
    if (box) box.innerHTML = kpiChip("Origine N-1", "ND");
    if (root) root.innerHTML = `<p style="text-align:center;font-weight:700;color:#444;">Donnée indisponible.</p>`;
    if (insight) insight.textContent = "";
    if (profilChart) { profilChart.dispose(); profilChart = null; }
    return;
  }

  // items
  const items = [
    { k: "lg3", label: "L3 gén." },
    { k: "lp3", label: "LP" },
    { k: "but3", label: "BUT3" },
    { k: "master", label: "Master" },
    { k: "autre", label: "Autre" },
    { k: "noninscri", label: "Non-inscrit" },
  ].map(x => ({ ...x, v: Number(p[x.k] || 0) }))
    .filter(it => it.v > 0); // enlève les 0

  const total = items.reduce((s, it) => s + it.v, 0);

  // KPIs
  if (box) {
    box.innerHTML = [
      kpiChip("Confirmés (PP)", fmtInt(Number(d.n_can || 0))),
      kpiChip("Total profil", total ? fmtInt(total) : "—"),
      kpiChip("Catégorie n°1", total ? items.slice().sort((a, b) => b.v - a.v)[0].label : "—"),
    ].join("");
  }

  if (!total) {
    root.innerHTML = `<p style="text-align:center;font-weight:700;color:#444;">Donnée indisponible.</p>`;
    if (insight) insight.textContent = "";
    if (profilChart) { profilChart.dispose(); profilChart = null; }
    return;
  }

  // ECharts
  if (profilChart) profilChart.dispose();
  profilChart = echarts.init(root);

  const top = items.slice().sort((a, b) => b.v - a.v)[0];
  const topPct = Math.round((top.v / total) * 100);

  const option = {
    tooltip: { trigger: "item" },
    legend: { top: "5%", left: "center" },
    graphic: [
      {
        type: "text",
        left: "center",
        top: "42%",
        style: {
          text: `${topPct}%`,
          font: "800 34px Poppins",
          fill: "#2d2d2d",
          textAlign: "center",
        },
      },
      {
        type: "text",
        left: "center",
        top: "58%",
        style: {
          text: top.label,
          font: "600 12px Poppins",
          fill: "#2d2d2d",
          textAlign: "center",
          opacity: 0.75,
        },
      },
    ],
    series: [
      {
        name: "Profil",
        type: "pie",
        radius: ["45%", "72%"],
        avoidLabelOverlap: true,
        padAngle: 3,
        itemStyle: { borderRadius: 10 },
        label: { show: false },
        labelLine: { show: false },
        data: items.map(it => ({ value: it.v, name: it.label })),
      },
    ],
  };

  profilChart.setOption(option, true);

  if (insight) {
    insight.textContent = `Vue : ${fmtInt(total)} confirmés (PP) répartis par origine N-1. Profil dominant : ${top.label} (${topPct}%).`;
  }

  if (!root.dataset.resizeBound) {
    window.addEventListener("resize", () => profilChart && profilChart.resize());
    root.dataset.resizeBound = "1";
  }
}

// =============================================================================
// SLIDE 5 — DÉTAILS (OPTION)
// =============================================================================
let detailsChart = null;

function renderDetailsPP(d, year) {
  const box = document.getElementById("kpis-details");
  const insight = document.getElementById("insight-details");
  const chartDom = document.getElementById("details-chart");

  const classes = (d.n_clas === null) ? null : Number(d.n_clas || 0);
  const rang = Number(d.rang_dernier || 0);

  const ratio = (classes && classes > 0) ? (rang / classes) * 100 : null;

  // KPIs
  if (box) {
    box.innerHTML = [
      kpiChip("Classés (PP)", classes === null ? "ND" : fmtInt(classes)),
      kpiChip("Dernier appelé (PP)", fmtInt(rang)),
      kpiChip("Ratio appel / classés", ratio === null ? "ND" : fmtPct(ratio)),
    ].join("");
  }

  // Insight
  if (insight) {
    if (classes === null) insight.textContent = "Détails avancés indisponibles (classés non fournis).";
    else insight.textContent = "Lecture avancée : mouvement de liste et tension d’appel.";
  }

  // Chart (si pas de container -> stop)
  if (!chartDom) return;

  // Si ND -> on vide le chart
  if (classes === null) {
    if (detailsChart) { detailsChart.dispose(); detailsChart = null; }
    chartDom.innerHTML = `<p style="text-align:center;font-weight:700;color:#444;">Graphique indisponible (ND).</p>`;
    return;
  }

  // Init / reset chart
  if (detailsChart) detailsChart.dispose();
  detailsChart = echarts.init(chartDom);

  // Bar values (on met ratio en %)
  const labels = ["Classés (PP)", "Dernier appelé", "Ratio (%)"];
  const values = [classes, rang, Math.round(ratio ?? 0)];

  const option = {
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        interval: 0,
        formatter: (v) => (v.length > 14 ? v.replace(" (PP)", "\n(PP)") : v),
      },
    },
    yAxis: { type: "value" },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params?.[0];
        if (!p) return "";
        const name = p.name;
        const val = p.value;
        if (name === "Ratio (%)") return `${name} : ${val}%`;
        return `${name} : ${fmtInt(val)}`;
      },
    },
    series: [
      {
        type: "bar",
        data: values,
        barMaxWidth: 44,
        label: {
          show: true,
          position: "top",
          formatter: (p) => (p.name === "Ratio (%)" ? `${p.value}%` : fmtInt(p.value)),
        },
      },
    ],
  };

  detailsChart.setOption(option, true);

  // Resize safe (1 seule fois)
  if (!chartDom.dataset.resizeBound) {
    window.addEventListener("resize", () => detailsChart && detailsChart.resize());
    chartDom.dataset.resizeBound = "1";
  }
}


// =============================================================================
// UI HELPERS
// =============================================================================
function progressRow(label, pct) {
  if (pct === null) {
    return `
      <div class="mob-row">
        <div class="mob-label">${label}</div>
        <div class="mob-bar"><div class="mob-fill" style="width:0%"></div></div>
        <div class="mob-val">ND</div>
      </div>
    `;
  }

  const p = Math.max(0, Math.min(100, Number(pct || 0)));
  return `
    <div class="mob-row">
      <div class="mob-label">${label}</div>
      <div class="mob-bar"><div class="mob-fill" style="width:${p}%"></div></div>
      <div class="mob-val">${p.toFixed(0)}%</div>
    </div>
  `;
}

// =============================================================================
// GAUGE (VITESSE)
// =============================================================================
function updateGauge(percent, pillText) {
  const svg = document.getElementById("gauge-svg");
  const valueEl = document.getElementById("gauge-value");
  const pillEl = document.getElementById("gauge-pill");
  if (!svg || !valueEl || !pillEl) return;

  const p = Math.round(Math.max(0, Math.min(100, percent)));
  valueEl.textContent = Number.isFinite(percent) ? p : "—";
  pillEl.textContent = pillText || `Taux d’admission : ${p}%`;

  svg.innerHTML = makeGaugeSVG(p);
}

function makeGaugeSVG(p) {
  const cx = 130, cy = 130, r = 95;
  const start = -180, end = 0;
  const angle = start + (p / 100) * 180;

  const toXY = (a, rr = r) => {
    const rad = (Math.PI / 180) * a;
    return { x: cx + rr * Math.cos(rad), y: cy + rr * Math.sin(rad) };
  };

  const arc = (a0, a1) => {
    const p0 = toXY(a0);
    const p1 = toXY(a1);
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
  };

  const bg = arc(start, end);
  const fg = arc(start, angle);
  const needle = toXY(angle, r - 25);

  const ticks = Array.from({ length: 6 }).map((_, i) => {
    const a = start + i * 36;
    const p0 = toXY(a, r - 8);
    const p1 = toXY(a, r - 18);
    return `<line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="#2d2d2d" stroke-width="2" opacity="0.35"></line>`;
  }).join("");

  return `
    <path d="${bg}" fill="none" stroke="#2d2d2d" stroke-width="10" stroke-linecap="round" opacity="0.25"></path>
    <path d="${fg}" fill="none" stroke="#2d2d2d" stroke-width="10" stroke-linecap="round"></path>
    ${ticks}
    <line x1="${cx}" y1="${cy}" x2="${needle.x}" y2="${needle.y}" stroke="#2d2d2d" stroke-width="4" stroke-linecap="round"></line>
    <circle cx="${cx}" cy="${cy}" r="8" fill="#2d2d2d"></circle>
  `;
}

// =============================================================================
// CAROUSEL
// =============================================================================
function initStatsSliderAuto() {
  const track = document.getElementById("stats-track");
  const prev = document.getElementById("stats-prev");
  const next = document.getElementById("stats-next");
  const dots = document.getElementById("stats-dots");
  if (!track || !prev || !next || !dots) return;

  // évite double bind si reload
  if (track.dataset.ready === "1") return;
  track.dataset.ready = "1";

  const slides = Array.from(track.querySelectorAll(".stats-slide"));
  const slideCount = slides.length;

  let index = 0;

  dots.innerHTML = slides
    .map((_, i) => `<button type="button" data-index="${i}" aria-label="Aller à la vue ${i + 1}"></button>`)
    .join("");

  function updateDots() {
    Array.from(dots.children).forEach((b, i) =>
      b.classList.toggle("active", i === index)
    );
  }

  function go(i) {
    index = (i + slideCount) % slideCount;
    track.style.transform = `translateX(-${index * 100}%)`;
    updateDots();
  }

  prev.addEventListener("click", () => go(index - 1));
  next.addEventListener("click", () => go(index + 1));
  dots.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    go(Number(btn.dataset.index));
  });

  go(0);
}
// ==============================================================================================
// MAPPING MASTER 
// ==============================================================================================
let selectedRegion = null;

// Tous les paths régions (ils ont id="Pays-de-la-Loire", etc.)
const regions = document.querySelectorAll(".region");

function normalizeRegionName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

const REGION_ALIAS = {
  "collectivites-d-outre-mer": "outre-mer",
  "la-reunion": "outre-mer",
  "guadeloupe": "outre-mer",
  "guyane": "outre-mer",
  "martinique": "outre-mer",
  "mayotte": "outre-mer"
};

export function setSelectedRegionFromData(regionLabel) {
  if (!regionLabel) return;

  const normalized = normalizeRegionName(regionLabel);
  const targetId = REGION_ALIAS[normalized] || normalized;

  const regions = document.querySelectorAll(".region");

  regions.forEach(r => {
    r.classList.remove("region-red");
    r.classList.add("region-blue");
  });

  const target = document.getElementById(targetId);
  if (!target) {
    console.warn("Région non trouvée dans le SVG :", regionLabel, "→", targetId);
    return;
  }

  target.classList.remove("region-blue");
  target.classList.add("region-red");
}

// ==============================================================================================
// Master similaires
// ==============================================================================================
function renderSimilarMasters(payload) {
  const box = document.querySelector("#similaires");
  if (!box) return;

  const currentId = payload.formation_id;
  const identite = payload.identite;

  if (!identite) {
    box.innerHTML = "<p>Données insuffisantes.</p>";
    return;
  }

  box.innerHTML = "<p>Recherche de masters similaires…</p>";

  fetch(`/api/search?annee=2024`)
    .then(res => res.json())
    .then(list => {
      const scored = list
        .filter(m => m.id !== currentId)
        .map(m => {
          let score = 0;

          if (m.discipline === identite.discipline) score += 4;
          if (m.mention === identite.mention) score += 3;
          if (m.parcours && m.parcours === identite.parcours) score += 2;
          if (m.region === identite.region) score += 1;
          if (m.academie === identite.academie) score += 1;

          return { ...m, score };
        })
        .sort((a, b) => b.score - a.score);

      let results = [];

      // helper pour ajouter sans doublon
      function pushUnique(list, items) {
        items.forEach(item => {
          if (!list.find(r => r.id === item.id)) {
            list.push(item);
          }
        });
      }

      // priorité haute → moyenne → basse
      pushUnique(results, scored.filter(m => m.score >= 4));

      if (results.length < 6) {
        pushUnique(results, scored.filter(m => m.score === 3));
      }

      if (results.length < 6) {
        pushUnique(results, scored.filter(m => m.score === 2));
      }

      if (results.length < 6) {
        pushUnique(results, scored.filter(m => m.score === 1));
      }

      if (results.length < 6) {
        pushUnique(
          results,
          scored.filter(m => m.score === 0)
        );
      }

      // sécurité finale
      results = results.slice(0, 6);



      if (!results.length) {
        box.innerHTML = "<p>Aucun master similaire pertinent.</p>";
        return;
      }

      box.innerHTML = results.map(m => `
  <li class="result-card" onclick="location.href='/master?id=${m.id}'">
    <div class="card-header">
      <img src="https://monmaster.gouv.fr/api/logo/${m.uai}" class="logo-result"/>
    </div>
    <strong>${m.mention}</strong>
    <small>${m.etab}</small>
  </li>
`).join("");
    })
    .catch(err => {
      console.error("SIMILAIRES ERROR:", err);
      box.innerHTML = "<p>Erreur lors du chargement.</p>";
    });
}




// ==============================================================================================
// Infos Master
// ==============================================================================================
function cleanAdresse(adresse, cp, ville) {
  if (!adresse) return "";
  let out = adresse;

  if (cp && ville) {
    out = out.replace(new RegExp(`\\b${cp}\\s+${ville}\\b`, "i"), "");
  }

  return out.trim();
}

function renderFormationLocation(payload, year = 2024) {
  const box = document.querySelector(".forma-content");
  if (!box) return;

  const i = payload.identite;
  const a = payload?.annees?.[String(year)]?.adresse;

  const street = a ? cleanAdresse(a.adresse, a.cp, a.ville) : null;

  box.innerHTML = `
    <div class="formation-location">
      <p class="etab"><strong>${i?.etablissement || "—"}</strong></p>

      ${i?.mention ? `<p class="mention">${i.mention}${i.parcours ? ` — ${i.parcours}` : ""}</p>` : ""}

      ${a
      ? `
            <p class="street">${street}</p>
            <p class="city">${a.cp} ${a.ville}</p>
          `
      : `
            <p class="fallback">
              Académie : ${i?.academie || "—"}<br>
              Région académique : ${i?.region || "—"}
            </p>
          `
    }
    </div>
  `;
}


function fillAdmissionList(id, items) {
  const ul = document.getElementById(id);
  if (!ul) return;

  ul.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    ul.innerHTML = "<li>Donnée non disponible</li>";
    return;
  }

  items.forEach(block => {
    if (!block) return;

    // découpe sur retours ligne ou virgules
    const parts = block
      .split(/\n|,\s(?=[A-ZÉÈÀ])/)
      .map(s => s.trim())
      .filter(Boolean);

    parts.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });
  });
}
