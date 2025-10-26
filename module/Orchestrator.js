// module/Orchestrator.js
import { getFicheMaster } from "./RESTManagement.js";
import { VizManager } from "./VizManager.js";

function setStatus(msg, type = "info") {
  const s = document.querySelector("#status");
  if (s) {
    s.textContent = msg; s.dataset.type = type;

  }
}

async function loadAndRender(formationId) {
  setStatus("Chargement…", "loading");
  try {
    const data = await getFicheMaster(formationId, "comparatif");
    setStatus("");
    VizManager.renderComparatif("#viz", data);
  } catch (e) {
    setStatus(`Erreur: ${e.message}`, "error");
    document.querySelector("#viz").innerHTML = "";
  }
}

export async function main() {
  const params = new URLSearchParams(location.search);
  const presetId = (params.get("id") || "").trim();

  const btn = document.querySelector("#btnLoad");
  const inp = document.querySelector("#inpId");
  btn.addEventListener("click", () => {
    const id = (inp.value || "").trim();
    if (!id) return setStatus("Saisis un formation_id.", "error");
    loadAndRender(id);
  });

  if (presetId) { // auto-charge si ?id=
    document.querySelector("#inpId").value = presetId;
    loadAndRender(presetId);
  }
}
