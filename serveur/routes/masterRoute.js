// serveur/routes/masterRoute.js
import { Router } from "express";
import { getMasterData, getMasterComparatif } from "../DataManager.js";

export const masterRoute = Router();

/**
 * Petit ping pour vérifier que le routeur est monté
 * GET /api/master/ping/test -> { ok: true, route: "master" }
 */
masterRoute.get("/ping/test", (_, res) => {
  res.json({ ok: true, route: "master" });
});

/**
 * Mono-année
 * Exemple: GET /api/master/0900816NWNGL/2024
 * Renvoie la fiche 2024 (ou 2023 selon annee)
 *
 * ⚠️ Cette route DOIT être déclarée AVANT /:id
 */
masterRoute.get("/:id/:annee", async (req, res) => {
  try {
    const { id, annee } = req.params;

    // Validation simple de l'année
    const year = Number(annee);
    if (!Number.isInteger(year) || (year !== 2023 && year !== 2024)) {
      return res.status(400).json({ error: "Année invalide (attendu 2023 ou 2024)." });
    }

    const data = await getMasterData(id, year);
    if (data?.error) return res.status(404).json(data);
    res.json(data);
  } catch (e) {
    console.error("[/api/master/:id/:annee] error:", e);
    res.status(500).json({ error: "Erreur serveur (mono-année)" });
  }
});

/**
 * Comparatif 2023 vs 2024
 * Exemple: GET /api/master/0900816NWNGL
 * Renvoie les deux années + deltas
 */
masterRoute.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getMasterComparatif(id);
    if (data?.error) return res.status(404).json(data);
    res.json(data);
  } catch (e) {
    console.error("[/api/master/:id] error:", e);
    res.status(500).json({ error: "Erreur serveur (comparatif)" });
  }
});

export default masterRoute;
