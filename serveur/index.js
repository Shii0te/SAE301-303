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

app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
