// module/VizManager.js
export const VizManager = {
    create(selector, data) {
      const el = document.querySelector(selector);
      const { identite, stats } = data;
      const { n_can = 0, n_acc = 0 } = stats?.candidatures || {};
      const taux = n_can ? (n_acc / n_can) * 100 : 0;
  
      el.innerHTML = `
        <section class="kpis">
          <div><span>Candidatures</span><strong>${n_can}</strong></div>
          <div><span>Admis</span><strong>${n_acc}</strong></div>
          <div><span>Taux d’admission</span><strong>${taux.toFixed(1)}%</strong></div>
        </section>
        <section class="header">
          <h2>${identite?.mention || "Master"} — ${data.annee}</h2>
          <div class="sub">${identite?.etablissement || ""} • ${identite?.region || ""}</div>
        </section>
      `;
    },
    update(selector, data) {
      this.create(selector, data);
    }
  };
  