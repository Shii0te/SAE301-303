// module/RESTManagement.js
export async function getFicheMaster(formationId, mode = "simple") {
  const url = mode === "comparatif"
    ? `/api/master/${encodeURIComponent(formationId)}`
    : `/api/master/${encodeURIComponent(formationId)}/${mode}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
