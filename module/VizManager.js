// module/VizManager.js
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

    /* ======================= Bloc indicateurs ======================= */
    const kpis = `
      <section class="kpis">
        ${kpi("Candidatures 2023", ncan23)}
        ${kpi("Candidatures 2024", ncan24)}
        ${kpi("Δ Candidatures (en pourcentage)", delta(ncan23, ncan24).toFixed(1) + "%")}

        ${kpi("Taux adm. 2023 (en pourcentage)", (tx23 * 100).toFixed(1) + "%")}
        ${kpi("Taux adm. 2024 (en pourcentage)", (tx24 * 100).toFixed(1) + "%")}
        ${kpi("Δ Taux adm. (en pourcentage)", delta(tx23, tx24).toFixed(1) + "%")}
      </section>
    `;

    /* ======================= Diagramme comparatif ======================= */
    const chart = renderBars([
      { label: "Candidatures", v23: ncan23, v24: ncan24 },
      { label: "Admis", v23: nacc23, v24: nacc24 }
    ]);

    /* ======================= Injection HTML ======================= */
    root.innerHTML = kpis + chart;

    renderSimilarMasters(payload);

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
    simplemaps_countrymap_mapdata.state_specific[code].hover_color = "#c41964";

    simplemaps_countrymap.load();
  };
}
