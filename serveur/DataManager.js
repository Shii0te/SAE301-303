// serveur/DataManager.js
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================================
   1) CACHE (pour éviter de recharger les CSV à chaque requête)
============================================================================ */

const cache = {
  rows: new Map(),  // annee → tableau brut du CSV
  cols: new Map(),  // annee → mapping des colonnes
  ids: new Map(),   // annee → Map(idFormation → ligne CSV)
};


/* ============================================================================
   2) UTILITAIRES SIMPLES
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

// normalisation en minuscules sans accents
const norm = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// essayer de trouver une colonne contenant certains mots
function findCol(headers, ...tokens) {
  const T = tokens.map(norm);
  for (const h of headers) {
    const H = norm(h);
    if (T.every((t) => H.includes(t))) return h;
  }
  return null;
}

// Nombre FR (1,25 → 1.25)
const parseNum = (v) => {
  if (!v) return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};


/* ============================================================================
   3) DETECTION AUTOMATIQUE DES COLONNES
============================================================================ */

function buildColumnMap(headers) {
  const has = (c) => headers.includes(c);
  const col = (options) => {
    for (const opt of options) {
      if (Array.isArray(opt)) {
        const detected = findCol(headers, ...opt);
        if (detected) return detected;
      } else if (typeof opt === "string" && has(opt)) {
        return opt;
      }
    }
    return null;
  };

  return {
    etab: col([["libelle", "etablissement"], "eta_nom"]),
    mention: col([["mention"], "mention"]),
    parcours: col([["parcours"], "parcours"]),
    academie: col([["academie"], "acad_lib"]),
    region: col([["region"], "acad_reg_lib"]),
    discipline: col([["discipline"], "disci_lib"]),

    id_formation: col([["identifiant", "formation"], "id_formation"]),
    n_can_pp: col([["confirme", "phase principale"], "n_can"]),
    n_can_pc: col([["confirme", "phase complementaire"]]),

    n_prop_total: col([["recu", "proposition"], "n_prop"]),
    n_acc_total: col([["accepte", "proposition"], "n_accept"]),

    rang_pp: col([["rang", "principal"], "rang_dernier"]),
  };
}


/* ============================================================================
   4) CHARGEMENT / CONSTRUCTION DU CACHE
============================================================================ */

async function ensure(year) {
  // charger les lignes CSV
  if (!cache.rows.has(year)) {
    const rows = await loadCSV(year);
    cache.rows.set(year, rows);
  }

  // détecter les colonnes
  if (!cache.cols.has(year)) {
    const rows = cache.rows.get(year);
    const headers = Object.keys(rows[0] || {});
    cache.cols.set(year, buildColumnMap(headers));
  }

  // index par ID
  if (!cache.ids.has(year)) {
    const rows = cache.rows.get(year);
    const idx = new Map();
    for (const r of rows) {
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
   5) API : RÉCUPÉRER UNE FORMATION
============================================================================ */

export async function getMasterData(formationId, year) {
  year = Number(year);
  await ensure(year);

  const rows = cache.rows.get(year);
  const K = cache.cols.get(year);
  const idx = cache.ids.get(year);

  const row = idx.get(String(formationId).trim());
  if (!row) return { error: "Master non trouvé", id: formationId, year };

  const get = (key) => (K[key] ? row[K[key]] : "");
  const getNum = (key) => parseNum(get(key));

  // identité
  const identite = {
    etablissement: get("etab"),
    mention: get("mention"),
    parcours: get("parcours"),
    academie: get("academie"),
    region: get("region"),
    discipline: get("discipline"),
  };

  // stats
  const n_can = getNum("n_can_pp") + getNum("n_can_pc");
  const n_prop = getNum("n_prop_total");
  const n_acc = getNum("n_acc_total");

  return {
    formation_id: String(formationId),
    annee: year,
    identite,
    stats: {
      candidatures: {
        n_can,
        n_prop,
        n_acc,
        taux_adm: n_can ? n_acc / n_can : 0,
        rang_dernier: getNum("rang_pp"),
      },
    },
  };
}


/* ============================================================================
   6) API : COMPARATIF 2023 / 2024
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
      ? ((d24.stats.candidatures.taux_adm -
          d23.stats.candidatures.taux_adm) /
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
