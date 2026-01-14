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
   1) FICHE MASTER — 2024
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
============================================================================ */
masterRoute.get("/:id/comparatif", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getMasterComparatif(id);
    if (data?.error) return res.status(404).json(data);
    res.json(data);
  } catch (err) {
    console.error("Erreur comparatif", err);
    res.status(500).json({ error: "Erreur serveur (comparatif)" });
  }
});

/* ============================================================================
   3) PROXY MONMASTER — ADMISSION
   GET /api/master/:uai/:mention/admission
============================================================================ */
masterRoute.get("/:uai/:mention/admission", async (req, res) => {
  const { uai, mention } = req.params;
  const inm = String(mention).slice(0, 8); // sécurité MonMaster

  try {
    const response = await fetch(
      `https://monmaster.gouv.fr/api/candidat/mm1/etablissements/${uai}/mentions/${inm}`
    );

    if (!response.ok) {
      return res.status(response.status).json(null);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("MonMaster error:", error);
    res.status(500).json(null);
  }
});

export default masterRoute;
