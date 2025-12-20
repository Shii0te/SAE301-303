// module/disciplineDomains.js

export const DOMAINES = [
  { id: "all", label: "Toutes les formations" },

  {
    id: "sfa",
    label: "Sciences fondamentales et applications",
    match: ["math", "informatique", "physique", "chimie", "ingénieur"]
  },
  {
    id: "shs",
    label: "Sciences humaines et sociales",
    match: ["sciences humaines", "sociologie", "psychologie", "géographie", "histoire"]
  },
  {
    id: "droit",
    label: "Droit et sciences politiques",
    match: ["droit", "sciences politiques"]
  },
  {
    id: "eco",
    label: "Sciences économiques et gestion",
    match: ["économie", "gestion", "management", "commerce", "finance"]
  },
  {
    id: "svt",
    label: "Sciences de la vie et de la Terre",
    match: ["biologie", "sciences de la vie", "environnement", "terre"]
  },
  {
    id: "lla",
    label: "Lettres, langues et arts",
    match: ["lettres", "langues", "arts", "design"]
  }
];

export function matchDomain(mention = "") {
  const m = mention.toLowerCase();

  for (const d of DOMAINES) {
    if (!d.match) continue;
    if (d.match.some(k => m.includes(k))) return d.id;
  }
  return "other";
}
