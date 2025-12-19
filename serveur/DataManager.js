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

      // PP only (2023 global)
      n_can_pp: H("n_can"),
      n_can_femme_pp: H("n_can_femme"),

      n_clas_pp: H("n_clas"),
      n_clas_femme_pp: H("n_clas_femme"),

      n_prop_pp: H("n_prop"),
      n_prop_femme_pp: H("n_prop_femme"),

      n_acc_pp: H("n_accept"),
      n_acc_femme_pp: H("n_accept_femme"),

      rang_pp: H("rang_dernier"),

      // mobilité (parts)
      pct_acc_acad_pp: H("pct_accept_acad"),
      pct_acc_reg_pp: H("pct_accept_acad_reg"),

      // profil N-1 sur confirmés (2023 : pas de BUT3 dans ton listing)
      can_lg3_pp: H("n_can_lg3"),
      can_lp3_pp: H("n_can_lp3"),
      can_but3_pp: null, // ND 2023
      can_master_pp: H("n_can_master"),
      can_autre_pp: H("n_can_autre"),
      can_noninscri_pp: H("n_can_noninscri"),
    };
  }


  // ===== MAPPING 2024 =====
  return {
    etab: H("Libellé de l'établissement"),
    mention: H("Intitulé de la mention"),
    parcours: H("Intitulé du parcours"),
    academie: H("Académie de l'établissement"),
    region: H("Région académique de l'établissement"),
    discipline: H("Discipline") || H("Discipline de la formation"),

    id_formation: H("Identifiant de la formation"),
    id_mention: H("Identifiant navette de mention"),
    id_parcours: H("Identifiant navette de parcours"),
    uai: H("Identifiant de l'établissement"),

    // ===== PP ONLY : Confirmés / Classés / Prop / Acceptés =====
    n_can_pp: H("Effectif de candidats ayant confirmé une candidature en phase principale"),
    n_can_femme_pp: H("Effectif de candidats ayant confirmé une candidature en phase principale - Dont effectif de femmes"),

    n_clas_pp: H("Effectif de candidats classés sur une candidature formulée en phase principale"),
    n_clas_femme_pp: H("Effectif de candidats classés sur une candidature formulée en phase principale - Dont effectif de femmes"),

    n_prop_pp: H("Effectif de candidats ayant reçu une proposition pour une candidature formulée en phase principale"),
    n_prop_femme_pp: H("Effectif de candidats ayant reçu une proposition pour une candidature formulée en phase principale - Dont effectif de femmes"),

    n_acc_pp: H("Effectif de candidats ayant accepté une proposition d'admission pour une candidature formulée en phase principale"),
    n_acc_femme_pp: H("Effectif de candidats ayant accepté une proposition d'admission pour une candidature formulée en phase principale - Dont effectif de femmes"),

    rang_pp: H("Rang du dernier appelé en phase principale"),

    // ===== mobilité : on essaie en "Part ..." si dispo, sinon on fallback plus tard =====
    pct_acc_acad_pp: H("Part des candidats parmi ceux ayant accepté une proposition d'admission pour une candidature formulée en phase principale ou en phase complémentaire issus de la même académie (à partir du lieu de formation)"),
    pct_acc_reg_pp: H("Part des candidats parmi ceux ayant accepté une proposition d'admission pour une candidature formulée en phase principale ou en phase complémentaire issus de la même région académique (à partir du lieu de formation)"),

    // ===== profil N-1 (confirmés PP) =====
    can_lg3_pp: H("Effectif de candidats en phase principale inscrits en troisième année de licence générale à la rentrée N-1"),
    can_lp3_pp: H("Effectif de candidats en phase principale inscrits en licence professionnelle à la rentrée N-1"),
    can_but3_pp: H("Effectif de candidats en phase principale inscrits en troisième année de bachelor universitaire de technologie à la rentrée N-1"),
    can_master_pp: H("Effectif de candidats en phase principale inscrits en master à la rentrée N-1"),
    can_autre_pp: H("Effectif de candidats en phase principale inscrits dans une autre formation à la rentrée N-1"),
    can_noninscri_pp: H("Effectif de candidats en phase principale qui n'étaient pas inscrits dans un établissement d'enseignement supérieur en France à la rentrée N-1"),
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

  const n_can_pp = getNum("n_can_pp");
  const n_clas_pp = getNum("n_clas_pp");
  const n_prop_pp = getNum("n_prop_pp");
  const n_acc_pp = getNum("n_acc_pp");

  const n_acc_femme_pp = getNum("n_acc_femme_pp");

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
      pp: {
        n_can: n_can_pp,
        n_clas: n_clas_pp,
        n_prop: n_prop_pp,
        n_acc: n_acc_pp,
        rang_dernier: getNum("rang_pp"),

        n_acc_femme: n_acc_femme_pp,

        pct_acc_acad: getNum("pct_acc_acad_pp"),     // 0 si absent
        pct_acc_reg: getNum("pct_acc_reg_pp"),       // 0 si absent

        profil_confirmes: {
          lg3: getNum("can_lg3_pp"),
          lp3: getNum("can_lp3_pp"),
          but3: getNum("can_but3_pp"),
          master: getNum("can_master_pp"),
          autre: getNum("can_autre_pp"),
          noninscri: getNum("can_noninscri_pp"),
        },
      }
    }
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

/* ============================================================================
   API : LISTE DES RÉGIONS
============================================================================ */

export async function getRegions(year) {
  year = Number(year);
  await ensure(year);

  const K = cache.cols.get(year);
  const rows = cache.rows.get(year);

  if (!K?.region) return [];

  const regions = new Set();

  for (const r of rows) {
    const reg = r[K.region];
    if (reg && reg.trim()) {
      regions.add(reg.trim());
    }
  }

  return Array.from(regions).sort();
}
