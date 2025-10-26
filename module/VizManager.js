export const VizManager = {
  renderComparatif(selector, payload) {
    const el = document.querySelector(selector);
    const Y23 = payload?.annees?.["2023"]?.stats?.candidatures || {};
    const Y24 = payload?.annees?.["2024"]?.stats?.candidatures || {};
    const comp = payload?.annees?.comparaison || {};

    const ncan23 = Y23.n_can || 0, ncan24 = Y24.n_can || 0;
    const nacc23 = Y23.n_acc || 0, nacc24 = Y24.n_acc || 0;
    const tx23 = Y23.taux_adm || 0, tx24 = Y24.taux_adm || 0;

    // KPIs + deltas
    const delta = (a,b) => (a===0 ? 0 : ((b-a)/a)*100);
    const dCan = delta(ncan23, ncan24);
    const dTx  = delta(tx23, tx24);

    const head = `
      <section style="margin-bottom:8px">
        <h2>${payload.identite?.mention || "Master"} </h2>
        <h3> ${payload.identite?.etablissement || "Nom de l'Etablissement"}</h3>
        <div style="color:#666">${payload.identite?.region || ""} • ${payload.identite?.discipline || ""}</div>
      </section>
      <section class="kpis">
        <div><span>Candidatures 2023</span><strong>${ncan23}</strong></div>
        <div><span>Candidatures 2024</span><strong>${ncan24}</strong></div>
        <div><span>Δ Candidatures</span><strong>${dCan.toFixed(1)}%</strong></div>

        <div><span>Taux adm. 2023</span><strong>${(tx23*100).toFixed(1)}%</strong></div>
        <div><span>Taux adm. 2024</span><strong>${(tx24*100).toFixed(1)}%</strong></div>
        <div><span>Δ Taux adm.</span><strong>${dTx.toFixed(1)}%</strong></div>
      </section>
    `;

    // Barres groupées (SVG)
    const w=520,h=220,pad=36, bw=36, groupGap=64, barGap=18;
    const groups = [
      { label:"Candidatures", v23:ncan23, v24:ncan24 },
      { label:"Admis",        v23:nacc23, v24:nacc24 }
    ];
    const max = Math.max(...groups.map(g=>Math.max(g.v23,g.v24))) || 1;
    const contentW = (bw*2 + barGap) * groups.length + groupGap*(groups.length-1);
    const x0 = (w - contentW)/2;

    const svgGroups = groups.map((g, i) => {
      const baseX = x0 + i*(bw*2 + barGap + groupGap);
      const bar = (val, offset) => {
        const bh = Math.round((val/max) * (h - pad*2));
        const x = baseX + offset;
        const y = h - pad - bh;
        return `
          <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6"></rect>
          <text x="${x + bw/2}" y="${y - 6}" font-size="12" text-anchor="middle">${val}</text>
        `;
      };
      return `
        ${bar(g.v23, 0)}
        ${bar(g.v24, bw + barGap)}
        <text x="${baseX + bw}" y="${h - pad + 16}" font-size="12" text-anchor="middle">${g.label}</text>
        <text x="${baseX + bw/2}" y="${pad - 20}" font-size="11" text-anchor="middle">2023</text>
        <text x="${baseX + bw + barGap + bw/2}" y="${pad - 20}" font-size="11" text-anchor="middle">2024</text>
      `;
    }).join("");

    const chart = `
      <section style="margin-top:12px;border:1px solid #eee;border-radius:10px;padding:12px">
        <div style="font-weight:600; margin-bottom:6px">Comparatif 2023 vs 2024</div>
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="260">
          <g>${svgGroups}</g>
        </svg>
      </section>
    `;

    el.innerHTML = head + chart;
  }
};
