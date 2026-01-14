// module/RESTManagement.js

/**
 * Récupère la fiche d'un master depuis l'API interne.
 *
 * @param {string} formationId
 * @param {string} mode - "simple", "comparatif", "2023", "2024"
 */
export async function getFicheMaster(formationId, mode = "simple") {
  let url;

  if (mode === "comparatif") {
    url = `/api/master/${encodeURIComponent(formationId)}/comparatif`;
  } else {
    url = `/api/master/${encodeURIComponent(formationId)}/${mode}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Erreur API Master (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Normalise un identifiant de mention MonMaster
 * (ex: 1402953Z86CV → 1402953Z)
 */
function normalizeMentionId(id) {
  return String(id || "").slice(0, 8);
}

/**
 * Récupère les attendus / critères d’admission
 * VIA le proxy backend (obligatoire pour éviter le CORS).
 *
 * @param {string} uai
 * @param {string} mentionId
 * @returns {object|null}
 */
export async function getAdmissionDetails(uai, mentionId) {
  if (!uai || !mentionId) return null;

  const inm = normalizeMentionId(mentionId);

  try {
    const res = await fetch(`/api/master/${uai}/${inm}/admission`);

    if (!res.ok) return null;

    return await res.json();

  } catch (e) {
    console.warn("Admission MonMaster indisponible", e);
    return null;
  }
}
