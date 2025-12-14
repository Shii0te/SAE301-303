// ============================================================================
//  ICON TREE (Base64)
// ============================================================================
const treeDataURI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAA2CAYAAADUOvnEAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA5tJREFUeNrcWE1oE0EUnp0kbWyUpCiNYEpCFSpIMdpLRTD15s2ePHixnj00N4/GoyfTg2fbiwdvvagHC1UQ66GQUIQKKgn1UAqSSFua38b3prPJZDs7s5ufKn0w7CaZ2W/fe9/73kyMRqNB3Nrj1zdn4RJ6du9T2u1a2iHYSxjP4d41oOHGQwAIwSUHIyh8/RA8XeiXh0kLGFoaXiTecw/hoTG4ZCSAaFkY0+BpsZceLtiAoV2FkepZSDk5EpppczBvpuuQCqx0YnkYcVVoqQYMyeCG+lFdaGkXeVOFNu4aEBalOBk6sbQrQF7gSdK5JXjuHXuYVIVyr0TZ0FjKDeCs6km7JYMUdrWAUVmZUBtmRnVPK+x6nIR2xomH06R35ggwJPeofWphr/W5UjPIxq8B2bKgE8C4HVHWvg+2gZjXj19PkdFztY7bk9TDCH/g6oafDPpaoMvZIRI5WyMB/0Hv++HkpTKE0kM+A+h20cPAfN4GuRyp9G+LMTW+z8rCLI8b46XO9zRcYZTde/j0AZm8WGb3Y2F9KLlE2nqYkjFLJAsDOl/lea0q55mqxXcL7YBc++bsCPMe8mUyU2ZIpnCoblca6TZA/ga2Co8PGg7UGUlEDd0ueptglbrRZLLE7poti6pCaWUo2pu1oaYI1CF9b9cCZPO3F8ikJQ/rPpQT5YETht26ss+uCIL2Y8vHwJGpA96GI5mjOlaKhowUy6BcNcgIhDviTGWCGFaqEuufWz4pgcbCh+w0gEOyOjTlTtYYlIWPYWKEsLDzOs+nhzaO1KEpd+MXpOoTUgKiNyhdy5aSMPNVqxtSsJFgza5EWA4zKtCJ2OGbLn0JSLu8+SL4G86p1Fpr7ABXdGFF/UTD4rfmFYFw4G9VAJ9SM3aF8l3yok4/J6IV9sDVb36ynmtJ2M5+CwxTYBdKNMBaocKGV2nYgkz6r+cHBP30MzAfi4Sy+BebSoPIOi8PW1PpCCvr/KOD4k9Zu0WSH0Y0+SxJ2awp/nlwKtcGyHOJ8vNHtRJzhPlsHr8MogtlVtwUU0tSM1x58upSKbfJnSKUR07GVMKkDNfXpzpv0RTHy3nZMVx5IOWdZIaPabGFvfpwpjnvfmJHXLaEvZUTseu/TeLc+xgAPhEAb/PbjO6PBaOTf6LQRh/dERde23zxLtOXbaKNhfq2L/1fAOPHDUhOpIf6485h7l+GNHHiSYPKE3Myz9sFxoJuAyazvwIMAItferha5LTqAAAAAElFTkSuQmCC';


// ============================================================================
//  TOP-LEVEL VizManager
// ============================================================================


export const VizManager = {

  /* ============================================================================
     RENDU COMPARATIF 2023 / 2024
  ============================================================================ */
  renderComparatif(selector, payload) {


    const root = document.querySelector(selector);
    const fiche = document.querySelector(".fiche-master");
    if (!root || !fiche) return;

    /* ======================= Données ======================= */
    const y23 = payload?.annees?.["2023"]?.stats?.candidatures || {};
    const y24 = payload?.annees?.["2024"]?.stats?.candidatures || {};

    const ncan23 = y23.n_can || 0;
    const ncan24 = y24.n_can || 0;
    const nacc23 = y23.n_acc || 0;
    const nacc24 = y24.n_acc || 0;
    const tx23 = y23.taux_adm || 0;
    const tx24 = y24.taux_adm || 0;

    const delta = (a, b) => (a === 0 ? 0 : ((b - a) / a) * 100);

    /* ======================= Fiche Master ======================= */
    fiche.querySelector("#nom-master").textContent = payload.identite?.discipline || "—";
    fiche.querySelector("#infos").textContent = payload.identite?.etablissement || "—";
    fiche.querySelector("#mention").textContent = payload.identite?.mention || "—";

    const kpisBox = document.getElementById("kpis");
    const chartBox = document.getElementById("comparatif");

    if (!kpisBox || !chartBox) {
      console.warn("Stats DOM manquant", { kpisBox, chartBox });
      return;
    }


    // rendu initial (2024 par défaut)
    renderStatsForYear(2024);

    function renderStatsForYear(year) {
      const ncan = year === 2024 ? ncan24 : ncan23;
      const nacc = year === 2024 ? nacc24 : nacc23;
      const tx = year === 2024 ? tx24 : tx23;

      kpisBox.innerHTML = `
    ${kpi(`Candidatures ${year}`, ncan)}
    ${kpi(`Admis ${year}`, nacc)}
    ${kpi(`Taux d’admission`, (tx * 100).toFixed(1) + "%")}
  `;

      chartBox.innerHTML = renderBars([
        { label: "Candidatures", v23: ncan23, v24: ncan24 },
        { label: "Admis", v23: nacc23, v24: nacc24 }
      ]);
    }

    document.querySelectorAll("#viz [data-year]").forEach(btn => {
      btn.addEventListener("click", () => {
        const year = Number(btn.dataset.year);

        document
          .querySelectorAll("#viz [data-year]")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        renderStatsForYear(year);
      });
    });
    renderSimilarMasters(payload);

    renderEvolutionTree(payload);

    function setActiveView(id) {
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      const el = document.getElementById(id);
      if (el) el.classList.add("active");
    }

    const views = ["viz", "evolution"];
    let currentViewIndex = 0;

    function showView(index) {
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById(views[index])?.classList.add("active");
    }

    // boutons
    document.getElementById("stats-prev")?.addEventListener("click", () => {
      currentViewIndex =
        (currentViewIndex - 1 + views.length) % views.length;
      showView(currentViewIndex);
    });

    document.getElementById("stats-next")?.addEventListener("click", () => {
      currentViewIndex =
        (currentViewIndex + 1) % views.length;
      showView(currentViewIndex);
    });

    // init
    showView(currentViewIndex);



    /* ======================= Redirection MonMaster ======================= */
    // Récupérer l'id de la formation depuis l'URL (?id=...)
    const params = new URLSearchParams(window.location.search);
    const formationId = params.get("id");

    const btn = document.getElementById("btn-monmaster");
    if (btn) {
      btn.addEventListener("click", () => {
        if (!formationId) {
          alert("Impossible d’ouvrir la page MonMaster : aucun id de formation dans l’URL.");
          return;
        }

        const url = `https://monmaster.gouv.fr/formation?rechercheBrut=${encodeURIComponent(formationId)}`;
        window.open(url, "_blank");
      });
    }
  }



};


/* ============================================================================
   TEMPLATES SIMPLES 
============================================================================ */

/** Affiche un bloc KPI */
function kpi(label, value) {
  return `
    <div>
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}


/** Génère un diagramme SVG comparant deux valeurs */
function renderBars(groups) {
  const W = 520, H = 220,
    pad = 36, bw = 36,
    gapBars = 18, gapGroups = 64;

  const maxVal = Math.max(...groups.flatMap(g => [g.v23, g.v24]), 1);

  const svg = groups.map((g, i) => {
    const baseX = 60 + i * (bw * 2 + gapBars + gapGroups);

    const bar23 = barRect(g.v23, maxVal, baseX, pad, bw, H);
    const bar24 = barRect(g.v24, maxVal, baseX + bw + gapBars, pad, bw, H);

    return `
      ${bar23}
      ${bar24}
      <text x="${baseX + bw}" y="${H - pad + 18}">${g.label}</text>
      <text x="${baseX + bw / 2}" y="${pad - 20}">2023</text>
      <text x="${baseX + bw + gapBars + bw / 2}" y="${pad - 20}">2024</text>
    `;
  }).join("");

  return `
    <section class="diagrammes">
      <div>Comparatif 2023 vs 2024</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="260"><g>${svg}</g></svg>
    </section>
  `;
}


/** Génère un rectangle + valeur */
function barRect(value, max, x, pad, bw, H) {
  const h = Math.round((value / max) * (H - pad * 2));
  const y = H - pad - h;

  return `
    <rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="6"></rect>
    <text x="${x + bw / 2}" y="${y - 6}">${value}</text>
  `;
}

function renderSimilarMasters(payload) {
  const box = document.querySelector("#similaires");
  if (!box) return;

  const currentId = payload.formation_id; // toujours fiable
  const discipline = payload.identite?.discipline || "";

  if (!discipline) {
    box.innerHTML = "<p>Aucune donnée pour trouver des masters similaires.</p>";
    return;
  }

  // On prend un mot-clé exploitable comme ancre de similarité
  const keyword = discipline.split(",")[0].split(" ")[0];

  box.innerHTML = "<p>Recherche de masters similaires...</p>";

  fetch(`/api/search?q=${encodeURIComponent(keyword)}&annee=2024`)
    .then(res => res.json())
    .then(list => {
      const sims = list
        .filter(m => m.id !== currentId)  // exclure le master actuel
        .slice(0, 6);

      if (!sims.length) {
        box.innerHTML = "<p>Aucun master similaire trouvé.</p>";
        return;
      }

      box.innerHTML = sims.map(m => `
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

function renderMap(region) {
  if (!window.simplemaps_countrymap) {
    console.warn("SimpleMaps non chargé");
    return;
  }
  if (!region) {
    console.warn("Aucune région fournie pour la carte");
    return;
  }

  const key = Object.keys(REGION_TO_CODE).find(k =>
    region.toLowerCase().includes(k)
  );

  if (!key) {
    console.warn("Région inconnue pour la carte :", region);
    return;
  }

  const code = REGION_TO_CODE[key];

  simplemaps_countrymap.hooks.ready = function () {

    // Désactiver toutes les régions
    for (const r in simplemaps_countrymap_mapdata.state_specific) {
      simplemaps_countrymap_mapdata.state_specific[r].color = "#d0d0d0";
    }

    // Colorer la région cible
    simplemaps_countrymap_mapdata.state_specific[code].color = "#e41f74";
    simplemaps_countrymap_mapdata.state_specific[code].hover_color = "#2419c4ff";

    simplemaps_countrymap.load();
  };
}


// ============================================================================
//  EVOLUTION GRAPH 
// ============================================================================
let evolutionInterval = null;

export function renderEvolutionTree(payload) {
  const y23 = payload?.annees?.["2023"]?.stats?.candidatures || {};
  const y24 = payload?.annees?.["2024"]?.stats?.candidatures || {};

  const values = {
    2023: { can: y23.n_can || 0, acc: y23.n_acc || 0 },
    2024: { can: y24.n_can || 0, acc: y24.n_acc || 0 },
  };

  const chartDom = document.getElementById("chart-evolution");
  if (!chartDom) return;

  const myChart = echarts.init(chartDom);
  const treeSymbol = "image:///images/bonhomme.svg";
  const lineCount = 5;

  function makeBushData(value, negative = false) {
    const MAX_VISUAL = 120;

    // facteur de compression
    const visualValue = Math.min(value, MAX_VISUAL);
    const ratio = visualValue / MAX_VISUAL;

    const r = Math.max(6, ratio * 300); // taille contrôlée
    const arr = [];

    for (let i = 0; i < lineCount; i++) {
      const dome =
        (lineCount - Math.abs(i - lineCount / 2 + 0.5)) * r;

      const sign = negative ? -1 : 1;

      arr.push({
        value: dome * sign * (i % 3 === 0 ? 1 : 0.9),
        symbolOffset: i % 2 ? ["50%", 0] : undefined
      });
    }

    return arr;
  }


  function getOption(value) {

    const pos = makeBushData(value);
    const neg = makeBushData(value, true);

    return {
      xAxis: { show: false, min: -2000, max: 2000 },
      yAxis: {
        type: "category",
        data: Array.from({ length: lineCount }, (_, i) => i),
        show: false
      },
      grid: { top: 20, bottom: 80 },
      series: [
        {
          type: "pictorialBar",
          symbol: treeSymbol,
          symbolSize: [30, 55],
          symbolRepeat: true,
          data: pos
        },
        {
          type: "pictorialBar",
          symbol: treeSymbol,
          symbolSize: [30, 55],
          symbolRepeat: true,
          data: neg
        }
      ]
    };
  }

  const labelEl = document.getElementById("chart-evolution-label");

  let currentYear = 2023;     // contrôlé par boutons
  let currentMetric = "can";  // auto switch: can <-> acc

  function update() {
    const value = values[currentYear][currentMetric];
    myChart.setOption(getOption(value), true);

    if (labelEl) {
      labelEl.textContent =
        `${currentYear} — ${value} ${currentMetric === "can" ? "candidatures" : "admis"}`;
    }
  }

  // ----------------------------
  // Boutons année (si présents)
  // ----------------------------
  document.querySelectorAll("#evolution [data-year]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentYear = Number(btn.dataset.year);

      // UI active
      document.querySelectorAll("#evolution [data-year]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      update(); // garde le metric courant (can/acc)
    });
  });

  // ----------------------------
  // Auto switch metric (3s)
  // ----------------------------
  if (evolutionInterval) clearInterval(evolutionInterval);
  evolutionInterval = setInterval(() => {
    currentMetric = currentMetric === "can" ? "acc" : "can";
    update();
  }, 3000);

  // Init
  update();

  // Optionnel: si tu redimensionnes la fenêtre
  window.addEventListener("resize", () => myChart.resize());
}





// ------------- version candidats-admis version boutons année & ad/cand ----------------------

// export function renderEvolutionTree(payload) {
//   const y23 = payload?.annees?.["2023"]?.stats?.candidatures || {};
//   const y24 = payload?.annees?.["2024"]?.stats?.candidatures || {};

//   const values = {
//     2023: {
//       can: y23.n_can || 0,
//       acc: y23.n_acc || 0,
//     },
//     2024: {
//       can: y24.n_can || 0,
//       acc: y24.n_acc || 0,
//     }
//   };

//   const chartDom = document.getElementById("chart-evolution");
//   if (!chartDom) return;

//   const myChart = echarts.init(chartDom);
//   const treeSymbol = "image:///images/bonhomme.svg";
//   const lineCount = 10;

//   function makeBushData(value, negative = false) {
//     const r = Math.max(6, value * 3);
//     const arr = [];
//     for (let i = 0; i < lineCount; i++) {
//       const dome = (lineCount - Math.abs(i - lineCount / 2 + 0.5)) * r;
//       const sign = negative ? -1 : 1;
//       arr.push({
//         value: dome * sign * (i % 3 === 0 ? 1 : 0.9),
//         symbolOffset: i % 2 ? ["50%", 0] : undefined
//       });
//     }
//     return arr;
//   }

//   function getOption(value) {
//     const pos = makeBushData(value);
//     const neg = makeBushData(value, true);

//     return {
//       xAxis: { show: false, min: -2000, max: 2000 },
//       yAxis: {
//         type: "category",
//         data: Array.from({ length: lineCount }, (_, i) => i),
//         show: false
//       },
//       grid: { top: 20, bottom: 80 },
//       series: [
//         {
//           type: "pictorialBar",
//           symbol: treeSymbol,
//           symbolSize: [30, 55],
//           symbolRepeat: true,
//           data: pos
//         },
//         {
//           type: "pictorialBar",
//           symbol: treeSymbol,
//           symbolSize: [30, 55],
//           symbolRepeat: true,
//           data: neg
//         }
//       ]
//     };
//   }

//   const labelEl = document.getElementById("chart-evolution-label");

//   let currentYear = 2023;
//   let currentMetric = "can"; // can | acc

//   function update() {
//     const value = values[currentYear][currentMetric];
//     myChart.setOption(getOption(value));
//     labelEl.textContent =
//       `${currentYear} — ${value} ${currentMetric === "can" ? "candidatures" : "admis"}`;
//   }

//   // INIT
//   update();

//   // ===== CONTROLS =====
//   document.querySelectorAll("[data-year]").forEach(btn => {
//     btn.addEventListener("click", () => {
//       currentYear = Number(btn.dataset.year);
//       document.querySelectorAll("[data-year]").forEach(b => b.classList.remove("active"));
//       btn.classList.add("active");
//       update();
//     });
//   });

//   document.querySelectorAll("[data-metric]").forEach(btn => {
//     btn.addEventListener("click", () => {
//       currentMetric = btn.dataset.metric;
//       document.querySelectorAll("[data-metric]").forEach(b => b.classList.remove("active"));
//       btn.classList.add("active");
//       update();
//     });
//   });
// }