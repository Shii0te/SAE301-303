// module/RESTManagement.js
export async function getFicheMaster(formationId, annee) {
    const url = `/api/master/${encodeURIComponent(formationId)}/${encodeURIComponent(annee)}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GET ${url} → HTTP ${res.status} ${text || ""}`.trim());
    }
    return res.json();
  }
  