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

function pick(headers, candidates) {
  const Hnorm = headers.map(h => norm(h));
  for (const label of candidates) {
    const idx = Hnorm.indexOf(norm(label));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function buildSearchMap(headers) {
  return {
    // ID technique (clé d'accès au backend)
    id: pick(headers, [
      "Identifiant de la formation",   // officiel 2024
      "id_formation",                  // fallback
      "ifc"                            // identifiant 2023
    ]),

    // Nom lisible du master
    mention: pick(headers, [
      "Intitulé de la mention",        // NOM humain 2024
      "mention"                        // 2023
    ]),

    // Nom lisible de l'établissement
    etab: pick(headers, [
      "Libellé de l'établissement",                // 2024
      "Libellé de l'établissement aujourd'hui",    // fallback
      "eta_nom"                                    // 2023
    ]),

    // UAI établissement
    uai: pick(headers, [
      "eta_uai",
      "Identifiant de l'établissement"
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

    if (!K.mention) K.mention = "Intitulé de la mention";
    if (!K.etab) K.etab = "Libellé de l'établissement";
    if (!K.uai) K.uai = "Identifiant de l'établissement";


    if (!K.id) return res.json([]);

    const tokens = query.split(/\s+/).filter(Boolean);
    const results = [];

    for (const r of rows) {
      const mention =
        (K.mention && r[K.mention]) ||
        r["Intitulé de la mention"] ||
        r["mention"] ||
        "";

      const etab =
        (K.etab && r[K.etab]) ||
        r["Libellé de l'établissement"] ||
        r["eta_nom"] ||
        "";

      const text = norm(`${mention} ${etab}`);



      // si query non vide : on vérifie que tous les mots sont dans haystack
      if (!allMode) {
        if (!tokens.every((t) => text.includes(t))) continue;
      }

      const id = String(r[K.id] || "").trim();
      if (!id) continue;

      results.push({
        id,
        mention: mention || "(mention inconnue)",
        etab: etab || "(établissement inconnu)",
        uai: r[K.uai] || "",    // <-- AJOUT ESSENTIEL
      });


      if (results.length >= 200) break;
    }

    res.json(results);
  } catch (err) {
    console.error("search error:", err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});
