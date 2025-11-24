// serveur/DataManager.js
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================================
   CACHE
============================================================================ */

const cache = {
  rows: new Map(),
  cols: new Map(),
  ids: new Map(),
};

/* ============================================================================
   UTILS
============================================================================ */

const csvPath = (year) =>
  path.join(__dirname, "..", "data", `fr-esr-mon_master_${year}.csv`);

function loadCSV(year) {
  return new Promise((resolve, reject) => {
    const out = [];
    fs.createReadStream(csvPath(year))
      .pipe(csv({ separator: ";" }))
      .on("data", (row) => out.push(row))
      .on("end", () => resolve(out))
      .on("error", reject);
  });
}

const parseNum = (v) => {
  if (!v) return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/* ============================================================================
   MAPPING 2023 / 2024
============================================================================ */

function buildColumnMap(headers, year) {
  const H = (name) => (headers.includes(name) ? name : null);

  if (year === 2023) {
    return {
      etab: H("eta_nom"),
      mention: H("mention"),
      parcours: H("parcours"),
      academie: H("acad_lib"),
      region: H("acad_reg_lib"),
      discipline: H("disci_lib"),

      id_formation: H("ifc"),
      id_mention: H("inm"),
      id_parcours: H("inmp"),
      uai: H("eta_uai"),

      n_can_pp: H("n_can"),
      n_can_pc: null,
      n_prop_total: H("n_prop"),
      n_acc_total: H("n_accept"),
      rang_pp: H("rang_dernier"),
    };
  }

  // ===== MAPPING 2024 =====
  return {
    etab: H("Libellé de l'établissement"),

    mention: H("Intitulé de la mention"),
    parcours: H("Intitulé du parcours"),

    academie: H("Académie de l'établissement"),
    region: H("Région académique de l'établissement"),

    discipline:
      H("Discipline") ||                      // colonne texte
      H("Discipline de la formation"),

    id_formation: H("Identifiant de la formation"),
    id_mention: H("Identifiant navette de mention"),
    id_parcours: H("Identifiant navette de parcours"),

    uai: H("Identifiant de l'établissement"),

    n_can_pp: H("Effectif de candidats ayant confirmé une candidature en phase principale"),
    n_can_pc: H("Effectif de candidats ayant confirmé une candidature en phase complémentaire"),

    n_prop_total: H("Effectif de candidats ayant reçu une proposition pour une candidature formulée en phase principale"),
    n_acc_total: H("Effectif de candidats ayant accepté une proposition d'admission pour une candidature formulée en phase principale"),

    rang_pp: H("Rang du dernier appelé en phase principale"),
  };
}


/* ============================================================================
   CHARGEMENT DU CACHE
============================================================================ */

async function ensure(year) {
  if (!cache.rows.has(year)) {
    const rows = await loadCSV(year);
    cache.rows.set(year, rows);
  }

  if (!cache.cols.has(year)) {
    const headers = Object.keys(cache.rows.get(year)[0] || {});
    cache.cols.set(year, buildColumnMap(headers, year));
  }

  if (!cache.ids.has(year)) {
    const idx = new Map();
    for (const r of cache.rows.get(year)) {
      const id =
        r["Identifiant de la formation"] ||
        r["id_formation"] ||
        r["ifc"];
      if (id) idx.set(String(id).trim(), r);
    }
    cache.ids.set(year, idx);
  }
}

/* ============================================================================
   API : MASTER PAR ANNÉE
============================================================================ */

export async function getMasterData(id, year) {
  year = Number(year);
  await ensure(year);

  const K = cache.cols.get(year);
  const row = cache.ids.get(year).get(String(id).trim());

  if (!row)
    return { error: "Master non trouvé", id, year };

  const get = (key) => (K[key] ? row[K[key]] : "");
  const getNum = (key) => parseNum(get(key));

  const n_pp = getNum("n_can_pp");
  const n_pc = getNum("n_can_pc");
  const n_can = n_pp + (n_pc || 0);

  return {
    formation_id: String(id),
    annee: year,
    identite: {
      etablissement: get("etab"),
      mention: get("mention"),
      parcours: get("parcours"),
      academie: get("academie"),
      region: get("region"),
      discipline: get("discipline"),
      uai: get("uai"),
    },
    stats: {
      candidatures: {
        n_can,
        n_prop: getNum("n_prop_total"),
        n_acc: getNum("n_acc_total"),
        taux_adm: n_can ? getNum("n_acc_total") / n_can : 0,
        rang_dernier: getNum("rang_pp"),
      },
    },
  };
}

/* ============================================================================
   API : COMPARATIF 2023–2024
============================================================================ */

export async function getMasterComparatif(id) {
  const d23 = await getMasterData(id, 2023);
  const d24 = await getMasterData(id, 2024);

  if (d23.error && d24.error)
    return { error: "Introuvable en 2023 et 2024", formation_id: id };

  const identite = d24.identite || d23.identite;

  const evoCan =
    d23.stats?.candidatures?.n_can
      ? ((d24.stats.candidatures.n_can - d23.stats.candidatures.n_can) /
        d23.stats.candidatures.n_can) *
      100
      : 0;

  const evoTx =
    d23.stats?.candidatures?.taux_adm
      ? ((d24.stats.candidatures.taux_adm - d23.stats.candidatures.taux_adm) /
        d23.stats.candidatures.taux_adm) *
      100
      : 0;

  return {
    formation_id: id,
    identite,
    annees: {
      2023: d23,
      2024: d24,
      comparaison: {
        evolution_candidats: evoCan,
        evolution_taux_admission: evoTx,
      },
    },
  };
}
