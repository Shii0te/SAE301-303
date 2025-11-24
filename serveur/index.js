// --- Import des modules ---
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Routes API
import { masterRoute } from "./routes/masterRoute.js";
import { searchRoute } from "./routes/searchRoute.js";

// --- Setup express ---
const app = express();
const PORT = process.env.PORT || 3000;

// Pour convertir import.meta.url en __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Fichiers statiques (front) ---
app.use("/styles", express.static(path.join(__dirname, "..", "styles")));
app.use("/module", express.static(path.join(__dirname, "..", "module")));
app.use("/images", express.static(path.join(__dirname, "..", "images")));

// --- API ---
app.use("/api/master", masterRoute);
app.use("/api/search", searchRoute);

// Route de test (santé du serveur)
app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

// --- Pages du site ---
app.get("/tools", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "tools.html"));
});

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});


app.get("/accueil", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "accueil.html"));
});

// --- Lancement du serveur ---
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});

