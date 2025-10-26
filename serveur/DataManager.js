// serveur/DataManager.js
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Cache mémoire par année ----------
const cache = {
  rows: new Map(),    // annee -> Array<row>
  ids: new Map(),     // annee -> Map<formation_id, row>
  cols: new Map(),    // annee -> { key -> columnName } (mapping dynamique)
};

// ---------- Helpers génériques ----------
function csvPath(annee) {
  return path.join(__dirname, "..", "data", `fr-esr-mon_master_${annee}.csv`);
}

function loadCSV(annee) {
  return new Promise((resolve, reject) => {
    const file = csvPath(annee);
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv({ separator: ";" }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// ===================== Utils robustes (garde-les) =====================

// Normalise (minuscules, sans accents) pour matcher des en-têtes 2024 "longs"
function norm(s = "") {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Cherche la 1re colonne dont l'en-tête contient TOUS les tokens donnés
function findCol(headers, ...tokens) {
  const ts = tokens.map(norm);
  for (const h of headers) {
    const H = norm(h);
    if (ts.every((t) => H.includes(t))) return h; // renvoie le nom exact de la colonne
  }
  return null;
}

// 1er champ non vide parmi plusieurs colonnes candidates
function firstNonEmpty(row, cols = []) {
  for (const c of cols) {
    const v = row[c];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

// parse nombre (gère les virgules françaises)
function parseNum(v) {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// ===================== Construction du mapping par année =====================
/**
 * Construit un mapping dynamique des colonnes à partir des en-têtes lus.
 * - Pour 2024 (entêtes longs), on détecte par tokens ("effectif", "confirmé", "phase ...")
 * - Pour 2023 (entêtes courts), on garde des alias exacts ("n_can", "n_prop", "n_accept", "rang_dernier"...)
 *
 * NB: On renvoie des *noms de colonnes* exacts (ceux présents dans le CSV),
 *     pas les valeurs. Les valeurs seront lues plus tard via `pickers(...)`.
 */
function buildColumnMap(headers) {
  const has = (name) => headers.includes(name);
  const col = (specs) => {

    // specs = [ [tokens...], "alias2023", "autreAliasCourt", ... ]
    // 1) essais par tokens (2024), 2) sinon alias exact (2023)
    for (const s of specs) {
      if (Array.isArray(s)) {
        const c = findCol(headers, ...s);
        if (c) return c;
      } else if (typeof s === "string") {
        if (has(s)) return s;
      }
    }

    return null;
  };

  // ---- IDENTITÉ -------------------------------------------------------
  const K = {
    // établissement, mention, parcours, académie, région, discipline
    etab: col([["libelle", "etablissement"], "eta_nom"]),
    mention: col([["intitule", "mention"], "mention"]),
    parcours: col([["intitule", "parcours"], "parcours"]),
    academie: col([["academie", "etablissement"], "acad_lib"]),
    region: col([["region", "academique", "etablissement"], "acad_reg_lib"]),
    discipline: col([["discipline"], "disci_lib"]),

    // ---- IDENTIFIANTS (utile pour rechercher des lignes) --------------
    id_formation: col([["identifiant", "formation"], "id_formation", "formation_id", "Identifiant de la formation"]),
    id_mention: col([["identifiant", "mention"], "inm"]),       // 2023: inm
    id_parcours: col([["identifiant", "parcours"], "inmp"]),     // 2023: inmp

    // ---- NOMBRES PRINCIPAUX ------------------------------------------
    // n_can (confirmés)
    n_can_pp: col([["effectif", "confirme", "phase principale"], "n_can"]),
    n_can_pc: col([["effectif", "confirme", "phase complementaire"]]),
    n_can: col(["n_can"]), // ← alias direct 2023

    // n_prop (reçus)
    n_prop_total: col([["effectif", "recu une proposition", "phase principale ou en phase complementaire"], "n_prop"]),
    n_prop_pp: col([["effectif", "recu une proposition", "phase principale"]]),
    n_prop_pc: col([["effectif", "recu une proposition", "phase complementaire"]]),
    n_prop: col(["n_prop"]), // ← alias direct 2023

    // n_acc (acceptés)
    n_acc_total: col([["effectif", "accepte", "proposition", "admission", "phase principale ou en phase complementaire"], "n_accept"]),
    n_acc_pp: col([["effectif", "accepte", "proposition", "admission", "phase principale"]]),
    n_acc_pc: col([["effectif", "accepte", "proposition", "admission", "phase complementaire"]]),
    n_accept: col(["n_accept"]), // ← alias direct 2023

    // rang du dernier appelé
    rang_pp: col([["rang", "dernier", "appele", "phase principale"], "rang_dernier"]),
    rang_pc: col([["rang", "dernier", "appele", "phase complementaire"]]),
    rang_dernier: col(["rang_dernier"]), // ← alias direct 2023


    // ---- PROFIL ADMIS (rentrée N-1) -----------------------------------
    // En 2023, alias courts: n_accept_lg3 / lp3 / master / autre / noninscri
    // En 2024, valeurs agrégées PP+PC existent via libellés "PP ou de PC inscrits en ..."
    acc_L3: col([["accepte", "admission", "inscrits", "troisieme", "licence generale"], "n_accept_lg3"]),
    acc_LP: col([["accepte", "admission", "inscrits", "licence professionnelle"], "n_accept_lp3"]),
    acc_Master: col([["accepte", "admission", "inscrits", "master"], "n_accept_master"]),
    acc_Autre: col([["accepte", "admission", "inscrits", "autre", "formation"], "n_accept_autre"]),
    acc_NonIns: col([["accepte", "admission", "n etaient pas inscrits"], "n_accept_noninscri"]), // optionnel

    // Parité (femmes admises global)
    acc_femmes: col([["accepte", "proposition", "admission", "dont", "femmes"], "n_accept_femme"]),
  };

  return K;
}

// ===================== Pickers (comment lire les valeurs) =====================
/**
 * On ne lit *pas* toujours 1 colonne = 1 valeur.
 * Exemple 2024: "confirmé" = PP + PC ; "accepté" idem.
 * Les pickers ci-dessous font l’assemblage nécessaire.
 */
function makePickers(K) {
  // Helpers: lire chaîne / nombre à partir d'une clé de mapping
  const getStr = (row, key) => (K[key] ? String(row[K[key]] ?? "").trim() : "");
  const getNum = (row, key) => (K[key] ? parseNum(row[K[key]]) : 0);

  // -- Identité
  const identite = (row) => ({
    etablissement: getStr(row, "etab"),
    mention: getStr(row, "mention"),
    parcours: getStr(row, "parcours"),
    academie: getStr(row, "academie"),
    region: getStr(row, "region"),
    discipline: getStr(row, "discipline"),
  });

  // -- Volumétrie (2024 = PP+PC, 2023 = alias court)
  const n_can = (row) => {
    // si on a les 2024 (PP/PC), on somme ; sinon fallback alias 2023
    const sum2024 = getNum(row, "n_can_pp") + getNum(row, "n_can_pc");
    const v2023 = getNum(row, "n_can"); // (n'existe que si K.n_can a matché un alias court)
    return sum2024 || v2023 || 0;
  };

  const n_prop = (row) => {
    // privilégié: la colonne "PP ou PC" (2024), sinon fallback PP+PC, sinon alias 2023
    const both = getNum(row, "n_prop_total");
    if (both) return both;
    const sum = getNum(row, "n_prop_pp") + getNum(row, "n_prop_pc");
    if (sum) return sum;
    // alias 2023
    const v2023 = getNum(row, "n_prop");
    return v2023 || 0;
  };

  const n_acc = (row) => {
    const both = getNum(row, "n_acc_total");
    if (both) return both;
    const sum = getNum(row, "n_acc_pp") + getNum(row, "n_acc_pc");
    if (sum) return sum;
    // 2023 alias: n_accept
    const v2023 = getNum(row, "n_accept");
    return v2023 || 0;
  };

  const rang_dernier = (row) => {
    // priorité: phase principale ; fallback: phase complémentaire ; fallback: alias 2023
    const vPP = getNum(row, "rang_pp");
    const vPC = getNum(row, "rang_pc");
    const v23 = getNum(row, "rang_dernier");
    return vPP || v23 || vPC || 0;
  };

  // -- Profils admis (L3, LP, Master, Autre, Femmes)
  const profil_admis = (row) => ({
    L3: getNum(row, "acc_L3"),
    LP: getNum(row, "acc_LP"),
    Master: getNum(row, "acc_Master"),
    Autre: getNum(row, "acc_Autre"),
    femmes: getNum(row, "acc_femmes"),
    // NonIns: getNum(row, "acc_NonIns"), // (si tu veux l’exposer)
  });

  return { identite, n_can, n_prop, n_acc, rang_dernier, profil_admis };
}

// ===================== Intégration dans getMasterData(...) =====================
// Dans ta fonction getMasterData(id, annee), après avoir:
// - lu/chargé les lignes (rows),
// - construit K = buildColumnMap(headers),
// - trouvé la bonne `row` par formation_id,
// ajoute ceci pour extraire proprement :

/*
const P = makePickers(K);

// lectures robustes
const val_n_can  = P.n_can(row);
const val_n_prop = P.n_prop(row);
const val_n_acc  = P.n_acc(row);
const taux_adm   = val_n_can ? val_n_acc / val_n_can : 0;

return {
  formation_id: String(formationId).trim(),
  annee: year,
  identite: P.identite(row),
  stats: {
    candidatures: {
      n_can: val_n_can,
      n_prop: val_n_prop,
      n_acc: val_n_acc,
      taux_adm,
      rang_dernier: P.rang_dernier(row),
    },
    profil_admis: P.profil_admis(row),
  },
};
*/

// ===================== Astuce debug =====================
// Après `const K = buildColumnMap(headers)`, tu peux vérifier ce qui a matché :
/*
console.table(Object.entries(K).map(([k, v]) => ({ key: k, column: v || "(non trouvée)" })));
*/


// lecture sécurisée via map
function numBy(K, key, row) {
  const c = K[key];
  return c ? parseNum(row[c]) : 0;
}
function strBy(K, key, row) {
  const c = K[key];
  return c ? String(row[c] ?? "").trim() : "";
}

// ---------- Indexation par identifiant de formation ----------
const ID_KEYS_CANDIDATES = [
  "Identifiant de la formation",
  "ifc",
];

function buildIdIndex(rows) {
  const idx = new Map();
  for (const r of rows) {
    const raw = firstNonEmpty(r, ID_KEYS_CANDIDATES);
    if (!raw) continue;
    const id = String(raw).trim();
    if (!idx.has(id)) idx.set(id, r);
  }
  return idx;
}

// ---------- Ensure (charge + map + index) ----------
async function ensure(annee) {
  if (!cache.rows.has(annee)) {
    const rows = await loadCSV(annee);
    cache.rows.set(annee, rows);
  }
  if (!cache.cols.has(annee)) {
    const rows = cache.rows.get(annee);
    const headers = Object.keys(rows[0] || {});
    const K = buildColumnMap(headers);
    cache.cols.set(annee, K);
    // console.table(Object.entries(K).map(([k, v]) => ({ key: k, column: v || "(non trouvée)" })));
  }
  if (!cache.ids.has(annee)) {
    const rows = cache.rows.get(annee);
    cache.ids.set(annee, buildIdIndex(rows));
  }
}

// ---------- API publique ----------
export async function getMasterData(formationId, annee) {
  const year = Number(annee);
  await ensure(year);

  const rows = cache.rows.get(year);
  const K = cache.cols.get(year);
  const idx = cache.ids.get(year);

  const row = idx.get(String(formationId).trim());
  if (!row) {
    return { error: "Master non trouvé", id: formationId, annee: year };
  }

  // Identité
  const identite = {
    etablissement: strBy(K, "etab", row),
    mention: strBy(K, "mention", row),
    parcours: strBy(K, "parcours", row),
    academie: strBy(K, "academie", row),
    region: strBy(K, "region", row),
    discipline: strBy(K, "discipline", row),
  };

  // ---- Utilisation des pickers (calculs corrects pour 2023 + 2024)
  const P = makePickers(K);

  const n_can = P.n_can(row);
  const n_prop = P.n_prop(row);
  const n_acc = P.n_acc(row);
  const taux_adm = n_can ? n_acc / n_can : 0;

  const profil = P.profil_admis(row);


  return {
    formation_id: String(formationId).trim(),
    annee: year,
    identite,
    stats: {
      candidatures: {
        n_can,
        n_prop,
        n_acc,
        taux_adm,
        rang_dernier: P.rang_dernier(row), // <-- correction ici
      },
      profil_admis: profil,
    },
  };

}

export async function getMasterComparatif(formationId) {
  const d23 = await getMasterData(formationId, 2023);
  const d24 = await getMasterData(formationId, 2024);

  if (d23.error && d24.error) {
    return { error: "Master non trouvé pour 2023 et 2024", formation_id: formationId };
  }

  // choisir une identité “référence”
  const identite =
    (d24 && !d24.error && d24.identite) ||
    (d23 && !d23.error && d23.identite) ||
    {};

  const ncan23 = d23?.stats?.candidatures?.n_can || 0;
  const ncan24 = d24?.stats?.candidatures?.n_can || 0;
  const tx23 = d23?.stats?.candidatures?.taux_adm || 0;
  const tx24 = d24?.stats?.candidatures?.taux_adm || 0;

  const evoCan = ncan23 ? ((ncan24 - ncan23) / ncan23) * 100 : 0;
  const evoTx = tx23 ? ((tx24 - tx23) / tx23) * 100 : 0;

  return {
    formation_id: String(formationId).trim(),
    identite,
    annees: {
      "2023": d23,
      "2024": d24,
      comparaison: {
        evolution_candidats: evoCan,
        evolution_taux_admission: evoTx,
      },
    },
  };
}
