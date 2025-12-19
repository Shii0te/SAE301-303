// serveur/routes/masterRoute.js
import { Router } from "express";
import { getMasterData, getMasterComparatif } from "../DataManager.js";

export const masterRoute = Router();

/* ============================================================================
   TEST
============================================================================ */

masterRoute.get("/ping/test", (_, res) => {
  res.json({ ok: true, route: "master" });
});

/* ============================================================================
   1) FICHE MASTER — 2024 PAR DÉFAUT
   GET /api/master/:id
============================================================================ */

masterRoute.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getMasterData(id, 2024);
    if (data?.error) return res.status(404).json(data);
    res.json(data);
  } catch (err) {
    console.error("Erreur GET /api/master/:id", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ============================================================================
   2) COMPARATIF 2023 / 2024
   GET /api/master/:id/comparatif
============================================================================ */

masterRoute.get("/:id/comparatif", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getMasterComparatif(id);
    if (data?.error) return res.status(404).json(data);
    res.json(data);
  } catch (err) {
    console.error("Erreur GET /api/master/:id/comparatif", err);
    res.status(500).json({ error: "Erreur serveur (comparatif)" });
  }
});

export default masterRoute;

// route de test region:

