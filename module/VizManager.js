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
    const tx23   = y23.taux_adm || 0;
    const tx24   = y24.taux_adm || 0;

    const delta = (a, b) => (a === 0 ? 0 : ((b - a) / a) * 100);

    /* ======================= Fiche Master ======================= */
    fiche.querySelector("#nom-master").textContent = payload.identite?.mention || "—";
    fiche.querySelector("#region").textContent     = payload.identite?.region || "—";
    fiche.querySelector("#domaine").textContent    = payload.identite?.discipline || "—";
    fiche.querySelector("#infos").textContent      = payload.identite?.etablissement || "—";

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
      { label: "Admis",        v23: nacc23, v24: nacc24 }
    ]);

    /* ======================= Injection HTML ======================= */
    root.innerHTML = kpis + chart;
  }
};


/* ============================================================================
   TEMPLATES SIMPLES (lisibles pour les étudiants)
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
