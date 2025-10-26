# Journal de bord – SAE MonMaster (Sprint 2 / 3)

## 📌 Introduction rapide

Ce journal retrace l’évolution du projet **Fiche descriptive MonMaster**, développé par notre groupe de 5 étudiants dans le cadre de la SAE.

L’objectif est de documenter, au fil du temps :

- l’avancement technique (code, architecture, modules),
- les difficultés rencontrées,
- les solutions et choix retenus,
- la répartition du travail dans l’équipe.

---

## 🧩 Structure technique (rappel initial)

- **Backend** : Node.js + Express → gère les fichiers CSV et l’API REST.
- **Frontend** : HTML + JS (modules) → affiche les données et visualisations.
- **Modules clés** :
  - DataManager (serveur) → lit les CSV et renvoie les infos du master.
  - RESTManagement → fait les requêtes API depuis le front.
  - Orchestrator → coordonne tout le front.
  - VizManager → crée les visualisations.
  - (CacheManager / UIManager à venir).

---

# Journal de bord – SAE 301.303 – Master+

## 📌 Introduction

Ce journal consigne, par date, l’avancement, les décisions et difficultés du projet .

---

## 25 oct. 2025 — Mise en place et première boucle API→Front

**Objectif.** Poser l’architecture minimale et afficher une première fiche exemple.

### Session de Travail 1

**Faits réalisés.**

- Initialisation du projet (Codespaces).
- Arborescence : `serveur/`, `module/`, `styles/`, `doc/`, `data/`.
- Route **mock** `GET /api/master/:id/:annee` (JSON structuré “fiche master”).
- Front : `RESTManagement.getFicheMaster()` + `Orchestrator.main()` (fetch réel).
- `VizManager` : rendu minimal (KPIs + mini visuel), état **loading/erreur** géré.

**Problèmes rencontrés.**

- 404 sur `/api/master/...` → route manquante/côté serveur (corrigé).

**Décisions prises.**

- **DataManager côté serveur** (lecture CSV, mapping 2023/2024, perf/sécurité).

**À faire (prochaines étapes).**

- Créer `serveur/DataManager.js` (csv-parser) pour lire **les CSV réels** dans `/data`.
- Remplacer le **mock** de `masterRoute` par `getMasterData(id, annee)`.
- Ajouter au JSON : `n_prop`, `rang_dernier`, “profil admis” (L3/LP/Master/Autre), part de femmes.
- (Optionnel) UI : sélecteurs `formationId` et `année` + `VizManager.update()`.

---
