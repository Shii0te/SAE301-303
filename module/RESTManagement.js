// module/RESTManagement.js

/**
 * Récupère la fiche d'un master depuis l'API.
 *
 * @param {string} formationId - Identifiant de la formation (ex: "0900816NWNGL")
 * @param {string} mode - "simple" (année précise) ou "comparatif"
 *    - "comparatif" → GET /api/master/:id        (2023 + 2024 + comparaison)
 *    - "2023" ou "2024" → GET /api/master/:id/:annee
 */

export async function getFicheMaster(formationId, mode = "simple") {
  let url;

  if (mode === "comparatif") {
    // Exemple : /api/master/0900816NWNGL/comparatif
    url = `/api/master/${encodeURIComponent(formationId)}/comparatif`;
  } else {
    // Exemple : /api/master/0900816NWNGL/2024
    url = `/api/master/${encodeURIComponent(formationId)}/${mode}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Erreur API (HTTP ${res.status})`);
  }

  return res.json();
}
