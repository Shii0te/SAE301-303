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

## 26-31 oct. 2025 — Intégration complète DataManager & outils

**À noter :** Les objectifs du 25 octobre sont désormais atteints et validés le 26 octobre 2025.

### Objectif

Finaliser la connexion entre le backend (lecture CSV 2023/2024) et le front (affichage comparatif), tout en ajoutant la page d’outillage pour une facilité pour nous meme coté developement et en stabilisant les visualisations.

**Faits réalisés.**

**Côté serveur :**

* Refonte complète du **DataManager** :
  * Gestion des différences de structure entre 2023 et 2024.
  * Mise en place d’un **cache mémoire** par année pour éviter les relectures multiple

**Côté client :**

* **tools.html** (pour nos recherches perso de masters) :
  * Affichage automatique de la liste complète au chargement (50 masters).
  * Recherche dynamique par mots-clés + sélecteur d’année.
  * Bouton « Ouvrir dans le viewer » → renvoi direct vers `/index?id=...`.
* **index.html** :
  * Chargement automatique du master comparatif si `?id` présent.
  * Interface épurée (un champ, un bouton, visualisation directe).
* **VizManager.js** :
  * Correction du chevauchement de texte (ajout marges adaptatives et tailles dynamiques) (affichages test - non définitifs).
  * Harmonisation des espacements et labels.
  * Résultat visuel clair et lisible sur toutes largeurs d’écran.

### Problèmes rencontrés et solutions


| Problème                             | Analyse                                                            | Solution                                                     |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Taux d’admission = 0**             | Colonnes`n_can` et `n_acc` non détectées (libellés différents) | Mapping par tokens + fusion PP/PC                            |
| **Aucune donnée 2023**               | ID =`ifc` non pris en compte                                       | Ajout de`ifc` à `ID_KEYS_CANDIDATES`                        |
| **Recherche tools vide**              | `/api/search` ignorait `q=""`                                      | Activation du mode`allMode` + limite 50                      |
| **Chevauchement des barres / textes** | Polices trop grandes, marges insuffisantes                         | Redimensionnement adaptatif + marges dynamiques              |
| **404 **`/api/master/...`             | Mauvais ordre de routes Express                                    | Déclaration`/api/master/:id/:annee` avant `/api/master/:id` |

### Résultats

* L’application est **totalement fonctionnelle** : données 2023 et 2024 lisibles et comparables.
* Les **visualisations** sont propres et lisibles.
* La **page tools** permet désormais de tester et vérifier n’importe quelle formation rapidement.

### **Autre décision prise – Suppression du module** `FilterManagement.js`

Après analyse des besoins réel de la SAE, le module de filtres n’est **pas nécessaire**.
L’objectif du projet étant de présenter **une fiche unique en comparatif 2023 <-> 2024**, il n’existe pas de système de recherche ni de filtrage dynamique attendu par le professeur.

En conséquence, le module **`FilterManagement.js` a été** **supprimé** pour alléger l’architecture et clarifier le code.

### Prochaines étapes

* Ajouter les nouvelles visualisations choisis par le groupe.

## 15 nov. 2025 — Stabilisation du front & ajout du logo dynamique

### Objectifs

Finaliser l’intégration visuelle v1, commenter le code, corriger les problèmes d’assets et rendre l’interface conforme à la maquette du groupe.

### Réalisations principales

* **Exposition du dossier** **`/images`** dans Express (résolution du problème d’images non affichées).
* **Refonte complète du CSS** :

  * mise en place de la bande fuchsia pleine largeur comme sur la maquette,
  * correction de la structure HTML (`.fiche-master` +`.badge-master`).


### **Ajout de nombreux commentaires explicatifs dans le code**

Pour que** ****toute l’équipe** puisse facilement lire / comprendre / modifier :

* Commentaires ajoutés dans :
  * **DataManager.js**
    * explication du mapping complexe entre colonnes 2023/2024,
    * logique du cache, etc...
  * **searchRoute.js**
    * commentaires sur`findCol`, la normalisation et la recherche tokenisée.
  * **RESTManagement.js**
    * explication du mode “simple” vs “comparatif”.
  * **Orchestrator.js**
    * précisions sur le flux de l’application (input → fetch → render).
  * **VizManager.js**
    * sections commentées pour que chacun comprenne comment fonctionne l’affichage (KPIs, barres comparatives, layout).

### Résultat

Le front est maintenant** ****fidèle à la maquette**, fonctionnel, lisible et robuste.
La fiche master est plus professionnelle et chaque université possède désormais un logo automatique cohérent.
N’importe quel membre du groupe peut ouvrir un fichier et comprendre instantanément le rôle des fonctions clés.

### Prochaines étapes

* Ajouter les visualisations finales choisies par le groupe.
* Ajuster les styles si besoin et finaliser la partie présentation.
*
