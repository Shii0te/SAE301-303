import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les assets nécessaires
app.use("/styles", express.static(path.join(__dirname, "..", "styles")));
app.use("/module", express.static(path.join(__dirname, "..", "module")));

// Route pour index.html à la racine du projet
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.get("/api/master/:id/:annee", (req, res) => {
  const { id, annee } = req.params;
  res.json({
    formation_id: id,
    annee: Number(annee),
    identite: {
      etablissement: "Université Exemple",
      mention: "Master Ex.",
      parcours: "Parcours A",
      academie: "Lyon",
      region: "Auvergne-Rhône-Alpes",
      discipline: "Informatique"
    },
    capacite: 120,
    stats: {
      candidatures: { n_can: 850, n_prop: 320, n_acc: 110, rang_dernier: 278 },
      profil_admis: { L3: 68, LP: 22, Master: 8, Autre: 12, femmes: 57 },
      mobilite: { etab: 30, acad: 44, region: 60 }
    }
  });
});


app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
