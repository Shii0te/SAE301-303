// serveur/routes/masterRoute.js
import { Router } from "express";
import { getMasterData, getMasterComparatif } from "../DataManager.js";

export const masterRoute = Router();

/* ============================================================================
   Ping (test)
============================================================================ */

masterRoute.get("/ping/test", (_, res) => {
  res.json({ ok: true, route: "master" });
});


/* ============================================================================
   1) FICHE MONO-ANNÉE
   GET /api/master/:id/:annee
   Exemple : /api/master/0900816NWNGL/2024
============================================================================ */

masterRoute.get("/:id/:annee", async (req, res) => {
  const { id, annee } = req.params;
  const year = Number(annee);

  if (![2023, 2024].includes(year)) {
    return res.status(400).json({ error: "Année invalide (2023 ou 2024 attendue)." });
  }

  try {
    const data = await getMasterData(id, year);
    if (data.error) return res.status(404).json(data);
    res.json(data);
  } catch (err) {
    console.error("Erreur GET /api/master/:id/:annee", err);
    res.status(500).json({ error: "Erreur serveur (mono-année)" });
  }
});


/* ============================================================================
   2) COMPARATIF 2023 + 2024
   GET /api/master/:id
============================================================================ */

masterRoute.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getMasterComparatif(id);
    if (data.error) return res.status(404).json(data);
    res.json(data);
  } catch (err) {
    console.error("Erreur GET /api/master/:id", err);
    res.status(500).json({ error: "Erreur serveur (comparatif)" });
  }
});

export default masterRoute;
