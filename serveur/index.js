import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { masterRoute } from "./routes/masterRoute.js";
import { searchRoute } from "./routes/searchRoute.js";



const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/styles", express.static(path.join(__dirname, "..", "styles")));
app.use("/module", express.static(path.join(__dirname, "..", "module")));

// API
app.use("/api/master", masterRoute);
app.use("/api/search", searchRoute);

app.get("/api/health", (_, res) => res.json({ ok: true }));


app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));


app.get("/tools", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "tools.html"));
});

// page d'accueil
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});
