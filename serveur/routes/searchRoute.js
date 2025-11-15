// serveur/routes/searchRoute.js
import { Router } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

export const searchRoute = Router();

/* ============================================================================
   1) UTILITAIRES
============================================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// chemin CSV par année
const csvPath = (year) =>
  path.join(__dirname, "..", "..", "data", `fr-esr-mon_master_${year}.csv`);

// charge 1 CSV → tableau d'objets
function loadRows(year) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath(year))
      .pipe(csv({ separator: ";" }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// normalize : minuscules + sans accents (pour recherche)
const norm = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// trouve une colonne contenant certains tokens
function findCol(headers, ...tokens) {
  const tokensNorm = tokens.map(norm);
  for (const h of headers) {
    const H = norm(h);
    if (tokensNorm.every((t) => H.includes(t))) return h;
  }
  return null;
}


/* ============================================================================
   2) MAPPING MINIMAL POUR LA RECHERCHE
============================================================================ */

function buildSearchMap(headers) {
  const col = (specs) => {
    for (const s of specs) {
      if (Array.isArray(s)) {
        const detected = findCol(headers, ...s);
        if (detected) return detected;
      }
      if (typeof s === "string" && headers.includes(s)) return s;
    }
    return null;
  };

  return {
    id: col([
      "id_formation",
      "Identifiant de la formation",
      "ifc",
    ]),

    mention: col([["mention"], "mention"]),

    etab: col([
      ["libelle", "etablissement"],
      ["libelle", "etablissement"],
      "eta_nom",
    ]),
  };
}


/* ============================================================================
   3) ROUTE DE RECHERCHE
============================================================================ */

searchRoute.get("/", async (req, res) => {
  try {
    const query = norm(req.query.q || "");
    const year = req.query.annee || "2024";

    const allMode = query.length === 0;
    const rows = await loadRows(year);

    if (!rows.length) return res.json([]);

    const headers = Object.keys(rows[0]);
    const K = buildSearchMap(headers);

    if (!K.id) return res.json([]);

    const tokens = query.split(/\s+/).filter(Boolean);
    const results = [];

    for (const r of rows) {
      const mention = r[K.mention] || "";
      const etab = r[K.etab] || "";
      const text = norm(`${mention} ${etab}`);

      // si query non vide : on vérifie que tous les mots sont dans haystack
      if (!allMode && !tokens.every((t) => text.includes(t))) continue;

      const id = String(r[K.id] || "").trim();
      if (!id) continue;

      results.push({
        id,
        mention: mention || "(mention inconnue)",
        etab: etab || "(établissement inconnu)",
      });

      if (results.length >= 200) break;
    }

    res.json(results);
  } catch (err) {
    console.error("search error:", err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});
