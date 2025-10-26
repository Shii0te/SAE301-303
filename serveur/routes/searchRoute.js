// serveur/routes/searchRoute.js
import { Router } from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import csv from "csv-parser";

export const searchRoute = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function csvPath(annee) {
  return path.join(__dirname, "..", "..", "data", `fr-esr-mon_master_${annee}.csv`);
}

function loadRows(annee) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath(annee))
      .pipe(csv({ separator: ";" }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// -------- utils de normalisation (comme dans DataManager) -----------
const norm = (s = "") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const findCol = (headers, ...tokens) => {
  const ts = tokens.map(norm);
  for (const h of headers) {
    const H = norm(h);
    if (ts.every(t => H.includes(t))) return h;
  }
  return null;
};

// -------- construit le mapping MINIMAL pour la recherche -----------
function buildSearchMap(headers) {
  const has = (n) => headers.includes(n);
  const col = (specs) => {
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

  return {
    // identifiant formation (ajout de 'ifc' pour 2023)
    id: col([
      ["identifiant", "formation"], "id_formation", "formation_id",
      "Identifiant de la formation", "Identifiant formation", "Identifiant navette", "ifc"
    ]),
    // mention
    mention: col([["intitule", "mention"], "mention"]),
    // établissement (variante 2024 “aujourd’hui” + alias 2023)
    etab: col([["libelle", "etablissement", "aujourd"], ["libelle", "etablissement"], "eta_nom"]),
  };
}

searchRoute.get("/", async (req, res) => {
  try {
    const q = norm((req.query.q || "").toString());
    const annee = (req.query.annee || "2024").toString();

    // si q vide => renvoyer tout (limité à 50 par défaut)
    const allMode = !q;

    const rows = await loadRows(annee);
    if (!rows.length) return res.json([]);

    const headers = Object.keys(rows[0]);
    const K = buildSearchMap(headers);

    if (!K.id) return res.json([]);

    const qTokens = q.split(/\s+/).filter(Boolean);
    const matches = []; // 👈 manquait ici !

    for (const r of rows) {
      const mention = r[K.mention] ?? "";
      const etab = r[K.etab] ?? "";
      const hay = norm(`${mention} ${etab}`);

      if (!allMode) {
        const ok = qTokens.every(t => hay.includes(t));
        if (!ok) continue;
      }

      const id = (r[K.id] ?? "").toString().trim();
      if (!id) continue;

      matches.push({
        id,
        mention: mention || "(mention inconnue)",
        etab: etab || "(établissement inconnu)",
      });

      // limite la liste renvoyée
      if (matches.length >= 200) break;
    }

    res.json(matches);
  } catch (e) {
    console.error("search error:", e);
    res.status(500).json({ error: "Recherche impossible" });
  }
});

