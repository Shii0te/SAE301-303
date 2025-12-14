// serveur/routes/searchRoute.js
import { Router } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

export const searchRoute = Router();

/* ============================================================================
   CONFIG
============================================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV figé sur 2024
const CSV_PATH = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "fr-esr-mon_master_2024.csv"
);

/* ============================================================================
   UTILS
============================================================================ */

// Normalisation pour la recherche
const norm = (s = "") =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Chargement CSV → tableau d’objets
function loadRows() {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv({ separator: ";" }))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// Trouve une colonne exacte (insensible à la casse / accents)
function pick(headers, candidates) {
  const H = headers.map(norm);
  for (const label of candidates) {
    const i = H.indexOf(norm(label));
    if (i !== -1) return headers[i];
  }
  return null;
}

/* ============================================================================
   MAPPING CSV
============================================================================ */

function buildSearchMap(headers) {
  return {
    id: pick(headers, [
      "Identifiant de la formation",
      "id_formation",
      "ifc",
    ]),

    mention: pick(headers, [
      "Intitulé de la mention",
      "mention",
    ]),

    etab: pick(headers, [
      "Libellé de l'établissement",
      "Libellé de l'établissement aujourd'hui",
      "eta_nom",
    ]),

    uai: pick(headers, [
      "eta_uai",
      "Identifiant de l'établissement",
    ]),
  };
}

/* ============================================================================
   ROUTE GET /api/search
============================================================================ */

searchRoute.get("/", async (req, res) => {
  try {
    const query = norm(req.query.q || "");
    const tokens = query.split(/\s+/).filter(Boolean);
    const allMode = tokens.length === 0;

    const rows = await loadRows();
    if (!rows.length) return res.json([]);

    const headers = Object.keys(rows[0]);
    const K = buildSearchMap(headers);

    if (!K.id || !K.mention || !K.etab) {
      return res.json([]);
    }

    const results = [];

    for (const row of rows) {
      const mention = row[K.mention] || "";
      const etab = row[K.etab] || "";
      const haystack = norm(`${mention} ${etab}`);

      if (!allMode && !tokens.every(t => haystack.includes(t))) continue;

      const id = String(row[K.id] || "").trim();
      if (!id) continue;

      results.push({
        id,
        mention: mention || "(mention inconnue)",
        etab: etab || "(établissement inconnu)",
        uai: row[K.uai] || "",
      });

      if (results.length >= 200) break;
    }

    res.json(results);
  } catch (err) {
    console.error("searchRoute error:", err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});
