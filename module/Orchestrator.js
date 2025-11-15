// module/Orchestrator.js
import { getFicheMaster } from "./RESTManagement.js";
import { VizManager } from "./VizManager.js";

/* ============================================================================
   Utilitaire : afficher un message de statut
============================================================================ */
function setStatus(message = "", type = "info") {
  const box = document.querySelector("#status");
  if (!box) return;

  box.textContent = message;
  box.dataset.type = type;
}

/* ============================================================================
   Chargement + rendu d'une fiche
============================================================================ */
async function loadAndRender(id) {
  setStatus("Chargement…", "loading");

  try {
    const data = await getFicheMaster(id, "comparatif");
    setStatus("");
    VizManager.renderComparatif("#viz", data);
  } catch (err) {
    console.error(err);
    setStatus("Erreur lors du chargement", "error");
    document.querySelector("#viz").innerHTML = "";
  }
}

/* ============================================================================
   Point d’entrée de la page
============================================================================ */
export function main() {
  const params = new URLSearchParams(location.search);
  const presetId = params.get("id")?.trim();

  const btn = document.querySelector("#btnLoad");
  const input = document.querySelector("#inpId");

  // bouton "Charger"
  btn.addEventListener("click", () => {
    const id = input.value.trim();
    if (!id) return setStatus("Veuillez saisir un identifiant.", "error");
    loadAndRender(id);
  });

  // chargement automatique via ?id=XXXX
  if (presetId) {
    input.value = presetId;
    loadAndRender(presetId);
  }
}
