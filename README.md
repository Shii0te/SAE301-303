# SAE301-303

## commande a utiliser

### enregistrer vos modifications :

git add .

git commit -m "nom de la maj"

git push

### pour recuperer un fichier modifié par quelqu'un d'autre en meme temps :

git pull

### si les fichiers sont differents et que vous souhaitez les modifier :

git merge

# Master+ — SAE 301/303

Fiche comparative des Masters (MonMaster 2023 / 2024)

Voici un **README.md clair, propre et professionnel**, parfaitement adapté à ton dépôt Git *Master+*.
Il reprend ce que tu as dans ta documentation admin, mais en version optimisée pour GitHub.

Tu peux le copier-coller directement dans `README.md`.

## 1. Présentation du projet

Master+ est une application web permettant d’afficher une fiche descriptive complète d’une formation de Master à partir des données publiques MonMaster.

Elle propose :

* une comparaison **2023 vs 2024** ;
* des indicateurs clés (candidatures, propositions, admissions, taux d’admission) ;
* un graphique comparatif automatisé ;
* un bouton d’accès direct à la formation sur MonMaster ;
* un système de **masters similaires** basé sur la discipline + région ;
* une page interne `tools.html` pour rechercher des identifiants de formation.

Le projet s’appuie sur :

* **Node.js / Express** pour le backend
* **JavaScript modulaire** pour le frontend
* **Fichiers CSV** officiels MonMaster pour les données

---

## 2. Installation

### 2.1 Prérequis

* Node.js 18+
* npm installé
* Fichiers CSV MonMaster (2023 et 2024) dans `./data/`
* Port 3000 libre

### 2.2 Installation des dépendances

```bash
npm install
```

### 2.3 Lancement du serveur

```bash
node serveur/index.js
```

Le serveur démarre sur :
[http://localhost:3000](http://localhost:3000)

---

## 3. Architecture

```
/data/                     → CSV MonMaster
/images/                   → ressources graphiques
/styles/
    main.css               → styles du site
/module/
    Orchestrator.js        → logique front
    RESTManagement.js      → gestion des appels API
    VizManager.js          → KPIs, graphiques, masters similaires
/serveur/
    index.js               → serveur Express
    DataManager.js         → lecture CSV, normalisation, cache
    /routes/
        masterRoute.js     → routes /api/master
        searchRoute.js     → routes /api/search
index.html                 → page principale (fiche master)
tools.html                 → page interne de recherche
```

---

## 4. Fonctionnement global

### 4.1 Backend (Node.js)

Le backend :

* lit les CSV via `csv-parser`
* détecte automatiquement les colonnes (2023 vs 2024)
* fusionne les colonnes Phase Principale / Phase Complémentaire
* met en cache toutes les données au premier chargement
* expose une API REST avec :

  * `/api/master/:id`
  * `/api/master/:id/:annee`
  * `/api/search?q=...`

### API principale : comparaison 2023 / 2024

```
GET /api/master/:id
```

Retour :

```json
{
  "formation_id": "...",
  "identite": {...},
  "annees": {
    "2023": {...},
    "2024": {...},
    "comparaison": {...}
  }
}
```

---

### 4.2 Frontend (JavaScript modulaire)

#### Orchestrator.js

* lit `?id=...` dans l’URL
* appelle `getFicheMaster()`
* envoie les données à VizManager
* gère les messages d’état (chargement, erreur)

#### RESTManagement.js

* gestion des `fetch()`
* aucun traitement métier

#### VizManager.js

* affiche la fiche master
* construit le graphique (SVG)
* affiche les KPIs
* ajoute les masters similaires
* gère le bouton MonMaster
* toute l'interface dynamique est générée ici

---

## 5. Données renvoyées par l’API

Exemple de structure :

```json
{
  "formation_id": "1303346F5QG3",
  "identite": {
    "mention": "METIERS...",
    "parcours": "Catalan",
    "discipline": "M.E.E.F.",
    "etablissement": "UPVD",
    "academie": "A11",
    "region": "R76"
  },
  "annees": {
    "2023": {
      "stats": {
        "candidatures": {
          "n_can": 4,
          "n_prop": 2,
          "n_acc": 2,
          "taux_adm": 0.50
        }
      }
    },
    "2024": {
      "stats": {
        "candidatures": {
          "n_can": 3,
          "n_prop": 2,
          "n_acc": 1,
          "taux_adm": 0.33
        }
      }
    }
  }
}
```

---

## 6. Maintenance

### Ajouter une nouvelle année

1. Ajouter le CSV dans `/data`
2. Vérifier les nouveaux intitulés de colonnes
3. Si besoin, ajouter des tokens dans `buildColumnMap()` :

   ```js
   findCol(headers, "effectif", "confirmé", "phase principale")
   ```
4. Le reste du système s’adapte automatiquement

### Modifier l'apparence

Tout se trouve dans :

```
/styles/main.css
```

### Modifier l’affichage graphique

Bloc principal :

```
/module/VizManager.js
```

## 7. Page outils (tools.html)

`tools.html` permet :

* d’afficher la liste complète des formations
* de rechercher par mots-clés (établissement, mention…)
* de copier l’identifiant
* d’ouvrir directement la fiche dans `/index.html?id=...`

C’est une page destinée aux développeurs, mais accessible pour tout utilisateur.
