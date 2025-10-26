import { Router } from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import csv from "csv-parser";

export const searchRoute = Router();

function loadRows(annee) {
  return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const file = path.join(__dirname, "..", "..", "data", `fr-esr-mon_master_${annee}.csv`);
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv({ separator: ";" }))
      .on("data", r => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

searchRoute.get("/", async (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  const annee = (req.query.annee || "2024").toString();
  if (!q) return res.json([]);

  const rows = await loadRows(annee);
  const idKeys = [
    "Identifiant de la formation","identifiant de la formation",
    "id_formation","formation_id","Identifiant formation","Identifiant navette"
  ];

  const results = [];
  for (const r of rows) {
    const mention = (r["Intitulé de la mention"] || r["mention"] || "").toLowerCase();
    const etab = (r["Libellé de l'établissement"] || r["eta_nom"] || "").toLowerCase();
    if (mention.includes(q) || etab.includes(q)) {
      const id = idKeys.map(k => r[k]).find(v => v && String(v).trim() !== "");
      if (id) {
        results.push({
          id: String(id).trim(),
          mention: r["Intitulé de la mention"] || r["mention"] || "",
          etab: r["Libellé de l'établissement"] || r["eta_nom"] || ""
        });
      }
    }
    if (results.length >= 10) break;
  }
  res.json(results);
});
