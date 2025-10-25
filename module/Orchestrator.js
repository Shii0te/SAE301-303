// module/Orchestrator.js
import { getFicheMaster } from "./RESTManagement.js";
import { VizManager } from "./VizManager.js";

function setStatus(message, type = "info") {
  const box = document.querySelector("#status");
  if (!box) return;
  box.textContent = message;
  box.dataset.type = type; // utile pour styliser
}

export async function main() {
  const root = document.querySelector("#viz");
  if (!root) return;

  // (temp) paramètres de démo – tu brancheras UI plus tard
  const formationId = "F-12345";
  const annee = 2024;

  try {
    setStatus("Chargement…", "loading");
    const data = await getFicheMaster(formationId, annee);
    setStatus(""); // clear
    VizManager.create("#viz", data);
  } catch (e) {
    setStatus(`Erreur de chargement : ${e.message}`, "error");
    root.innerHTML = ""; // pas de viz si erreur
  }
}
