import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use(express.static("styles")); // sert index.html, main.css
app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
