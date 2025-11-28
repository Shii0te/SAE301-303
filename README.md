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

# 📄** ****README.md — Projet MASTER+ (SAE 301/303)**

*Version mise à jour après corrections finales*

---

# 1. Présentation du projet

**MASTER+** est une application web permettant :

* de rechercher un master via mots-clés,
* d’afficher une fiche descriptive complète comparant** ****2023 ↔ 2024**,
* de visualiser graphiquement les indicateurs (candidatures, propositions, admissions),
* d’afficher automatiquement des** ****masters similaires**,
* d’afficher les** ****logos officiels des établissements** via l’API MonMaster.

Le projet utilise :

* **Node.js + Express** pour le backend,
* **CSV officiels MonMaster (2023 & 2024)**,
* **JavaScript modulaire** pour le frontend,
* **fetch API** pour le dialogue client/serveur,
* **SVG généré dynamiquement** pour les diagrammes.

---

# 2. Installation et lancement

## 2.1. Prérequis

* Node.js 18+
* NPM
* CSV officiels placés dans** **`/data`
* Port 3000 libre

## 2.2. Installation

<pre class="overflow-visible!" data-start="1357" data-end="1380"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>npm install
</span></span></code></div></div></pre>

## 2.3. Lancement du serveur

<pre class="overflow-visible!" data-start="1411" data-end="1444"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>node serveur/index.js
</span></span></code></div></div></pre>

Serveur accessible sur :

<pre class="overflow-visible!" data-start="1471" data-end="1500"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>http:</span><span>//localhost:3000</span><span>
</span></span></code></div></div></pre>

---

# 3. Architecture du projet

<pre class="overflow-visible!" data-start="1536" data-end="2349"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>/data/                        → CSV 2023 + 2024
/images/                      → Logos + images statiques
/styles/main.css              → Styles globaux
/index.html                   → Fiche Master
/tools.html                   → Page de recherche

/module/
   Orchestrator.js            → Récupère ID dans l’URL + appelle API + orchestrateur d’affichage
   RESTManagement.js          → Gère les appels API
   VizManager.js              → Génère KPIs + graphiques + masters similaires

/serveur/
   index.js                   → Express (serveur + static + montage routes)

   /routes/
        masterRoute.js        → GET /api/master/:</span><span>id</span><span> + comparatif
        searchRoute.js        → GET /api/search (recherche filtrée)

   DataManager.js             → Lecture CSV + mapping 2023/2024 + cache + normalisation
</span></span></code></div></div></pre>

---

# 4. Backend (Node.js)

Le backend fournit :

### ✔️** **`/api/master/:id`

Renvoie** ****les données d’une année** (2023 ou 2024).

### ✔️** **`/api/master/:id/comparatif`

Retourne :

<pre class="overflow-visible!" data-start="2528" data-end="2747"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"formation_id"</span><span>:</span><span> </span><span>"XXXX"</span><span>,</span><span>
  </span><span>"identite"</span><span>:</span><span> </span><span>{</span><span> ... </span><span>}</span><span>,</span><span>
  </span><span>"annees"</span><span>:</span><span> </span><span>{</span><span>
    </span><span>"2023"</span><span>:</span><span> </span><span>{</span><span>...</span><span>}</span><span>,</span><span>
    </span><span>"2024"</span><span>:</span><span> </span><span>{</span><span>...</span><span>}</span><span>,</span><span>
    </span><span>"comparaison"</span><span>:</span><span> </span><span>{</span><span>
      </span><span>"evolution_candidats"</span><span>:</span><span> ...</span><span>,</span><span>
      </span><span>"evolution_taux_admission"</span><span>:</span><span> ...
    </span><span>}</span><span>
  </span><span>}</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

### ✔️** **`/api/search?q=...&annee=2024`

Renvoie une liste simplifiée :

<pre class="overflow-visible!" data-start="2819" data-end="2968"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>[</span><span>
  </span><span>{</span><span>
    </span><span>"id"</span><span>:</span><span> </span><span>"1402986KSBAQ"</span><span>,</span><span>
    </span><span>"mention"</span><span>:</span><span> </span><span>"Droit des affaires"</span><span>,</span><span>
    </span><span>"etab"</span><span>:</span><span> </span><span>"Université Paris Nanterre"</span><span>,</span><span>
    </span><span>"uai"</span><span>:</span><span> </span><span>"0772894C"</span><span>
  </span><span>}</span><span>
</span><span>]</span><span>
</span></span></code></div></div></pre>

*(Et dorénavant : ✔️ URL logo via** **`https://monmaster.gouv.fr/api/logo/${uai}`)*

---

# 5. DataManager.js

*(Version finale propre et fiable)*

### ✔️ Mapping séparé 2023 / 2024

Plus aucun bug d’identifiants mélangés.

### ✔️ Prise en charge des colonnes :

* mention 2023 (`mention`)
* mention 2024 (`Intitulé de la mention`)
* établissement (`eta_nom` /** **`Libellé de l'établissement`)
* UAI (`eta_uai` /** **`Identifiant de l'établissement`)
* discipline 2023 / 2024
* stats principales PP/PC

### ✔️ Cache intégré

Lecture CSV** ****effectuée une seule fois**.

### ✔️ Index par** **`id_formation`

Rapide et fiable.

---

# 6. Frontend

## 6.1. Orchestrator.js

* récupère** **`?id=XXXX`,
* appelle** **`/api/master/:id/comparatif`,
* transmet à VizManager,
* gère chargement / erreurs.

## 6.2. RESTManagement.js

Wrap fetch API.

## 6.3. VizManager.js

* affiche les KPIs,
* affiche le diagramme comparatif,
* gère l’injection HTML,
* affiche les logos UAI,
* gère les** ****masters similaires** grâce à :
  * discipline → mots-clés,
  * recherche** **`/api/search?q=...`,
  * exclusion du master actuel,
  * affichage de 6 cartes maximum.

---

# 7. Page Tools (Recherche)

Fonctionnalités :

* recherche multi-mots-clés,
* filtrage par année,
* résultats format carte,
* affichage du logo via UAI,
* carte cliquable → fiche master.

---

# 8. Maintenance

## 8.1. Ajouter une année (2025…)

1. Ajouter CSV dans** **`/data`
2. Ajouter un mapping dans** **`buildColumnMap(headers, year)`
3. Vérifier les colonnes statiques
4. Tester** **`/api/master/:id/2025`

## 8.2. Modifier les styles

`/styles/main.css`

## 8.3. Modifier les graphiques

`/module/VizManager.js`

## 8.4. Modifier les comportements

`/module/Orchestrator.js`

---

# 9. Fonctionnalités Bonus

*(déjà implémentées ou prêtes)*

* ✔️ Logos établissements via UAI
* ✔️ Masters similaires intelligents
* ✔️ Recherche avec fallback automatique 2023/2024
* ✔️ Composants JS modulaires propres
* ✔️ Architecture MVC-lite

---

# 10. Liens importants

**Dépôt GitHub**
[https://github.com/Shii0te/SAE301-303.git](https://github.com/Shii0te/SAE301-303.git)

Fiche comparative des Masters (MonMaster 2023 / 2024)

Voici un **README.md clair, propre et professionnel**, parfaitement adapté à ton dépôt Git *Master+*.
Il reprend ce que tu as dans ta documentation admin, mais en version optimisée pour GitHub.

Tu peux le copier-coller directement dans `README.md`.

## 1. Présentation du projet

# **README.md — Projet MASTER+ (SAE 301/303)**

# 1. Présentation du projet

**MASTER+** est une application web permettant :

* de rechercher un master via mots-clés,
* d’afficher une fiche descriptive complète comparant** ****2023 & 2024**,
* de visualiser graphiquement les indicateurs (candidatures, propositions, admissions),
* d’afficher automatiquement des** ****masters similaires**,
* d’afficher les** ****logos officiels des établissements** via l’API MonMaster.

Le projet utilise :

* **Node.js + Express** pour le backend,
* **CSV officiels MonMaster (2023 & 2024)**,
* **JavaScript modulaire** pour le frontend,
* **fetch API** pour le dialogue client/serveur,
* **SVG généré dynamiquement** pour les diagrammes.

---

# 2. Installation et lancement

## 2.1. Prérequis

* Node.js 18+
* NPM
* CSV officiels placés dans** **`/data`
* Port 3000 libre

## 2.2. Installation

<pre class="overflow-visible!" data-start="1357" data-end="1380"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>npm install
</span></span></code></div></div></pre>

## 2.3. Lancement du serveur

<pre class="overflow-visible!" data-start="1411" data-end="1444"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>node serveur/index.js
</span></span></code></div></div></pre>

Serveur accessible sur :

<pre class="overflow-visible!" data-start="1471" data-end="1500"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>http:</span><span>//localhost:3000</span><span>
</span></span></code></div></div></pre>

---

# 3. Architecture du projet

<pre class="overflow-visible!" data-start="1536" data-end="2349"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>/data/                        → CSV 2023 + 2024
/images/                      → Logos + images statiques
/styles/main.css              → Styles globaux
/index.html                   → Fiche Master
/tools.html                   → Page de recherche

/module/
   Orchestrator.js            → Récupère ID dans l’URL + appelle API + orchestrateur d’affichage
   RESTManagement.js          → Gère les appels API
   VizManager.js              → Génère KPIs + graphiques + masters similaires

/serveur/
   index.js                   → Express (serveur + static + montage routes)

   /routes/
        masterRoute.js        → GET /api/master/:</span><span>id</span><span> + comparatif
        searchRoute.js        → GET /api/search (recherche filtrée)

   DataManager.js             → Lecture CSV + mapping 2023/2024 + cache + normalisation
</span></span></code></div></div></pre>

---

# 4. Backend (Node.js)

Le backend fournit :

### `/api/master/:id`

Renvoie** ****les données d’une année** (2023 ou 2024).

### /api/master/:id/comparatif`

Retourne :

<pre class="overflow-visible!" data-start="2528" data-end="2747"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"formation_id"</span><span>:</span><span> </span><span>"XXXX"</span><span>,</span><span>
  </span><span>"identite"</span><span>:</span><span> </span><span>{</span><span> ... </span><span>}</span><span>,</span><span>
  </span><span>"annees"</span><span>:</span><span> </span><span>{</span><span>
    </span><span>"2023"</span><span>:</span><span> </span><span>{</span><span>...</span><span>}</span><span>,</span><span>
    </span><span>"2024"</span><span>:</span><span> </span><span>{</span><span>...</span><span>}</span><span>,</span><span>
    </span><span>"comparaison"</span><span>:</span><span> </span><span>{</span><span>
      </span><span>"evolution_candidats"</span><span>:</span><span> ...</span><span>,</span><span>
      </span><span>"evolution_taux_admission"</span><span>:</span><span> ...
    </span><span>}</span><span>
  </span><span>}</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

### `/api/search?q=...&annee=2024`

Renvoie une liste simplifiée :

<pre class="overflow-visible!" data-start="2819" data-end="2968"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>[</span><span>
  </span><span>{</span><span>
    </span><span>"id"</span><span>:</span><span> </span><span>"1402986KSBAQ"</span><span>,</span><span>
    </span><span>"mention"</span><span>:</span><span> </span><span>"Droit des affaires"</span><span>,</span><span>
    </span><span>"etab"</span><span>:</span><span> </span><span>"Université Paris Nanterre"</span><span>,</span><span>
    </span><span>"uai"</span><span>:</span><span> </span><span>"0772894C"</span><span>
  </span><span>}</span><span>
</span><span>]</span><span>
</span></span></code></div></div></pre>

*(Et dorénavant :  URL logo via** **`https://monmaster.gouv.fr/api/logo/${uai}`)*

---

# 5. DataManager.js

*(Version finale propre et fiable)*

## Mapping séparé 2023 / 2024

Plus aucun bug d’identifiants mélangés.

## Prise en charge des colonnes :

* mention 2023 (`mention`)
* mention 2024 (`Intitulé de la mention`)
* établissement (`eta_nom` /** **`Libellé de l'établissement`)
* UAI (`eta_uai` /** **`Identifiant de l'établissement`)
* discipline 2023 / 2024
* stats principales PP/PC

## Cache intégré

Lecture CSV **effectuée une seule fois**.

## Index par`id_formation`

Rapide et fiable.

---

# 6. Frontend

## 6.1. Orchestrator.js

* récupère** **`?id=XXXX`,
* appelle** **`/api/master/:id/comparatif`,
* transmet à VizManager,
* gère chargement / erreurs.

## 6.2. RESTManagement.js

Wrap fetch API.

## 6.3. VizManager.js

* affiche les KPIs,
* affiche le diagramme comparatif,
* gère l’injection HTML,
* affiche les logos UAI,
* gère les** ****masters similaires** grâce à :
  * discipline → mots-clés,
  * recherche** **`/api/search?q=...`,
  * exclusion du master actuel,
  * affichage de 6 cartes maximum.

---

# 7. Page accueil.html (Accueil du site)

Fonctionnalités :

* recherche multi-mots-clés,
* filtrage par année,
* résultats format carte,
* affichage du logo via UAI,
* carte cliquable → fiche master.

---

# 8. Page tools.html (Recherche)

Fonctionnalités :

* Simple Accueil sur le site
* Explication rapide

---


# 9. Page index.html (page des masters)

Fonctionnalités :

* Explication détaillé de chaque masters
* Masters similaires

# 10. Maintenance

## 10.1. Ajouter une année (2025…)

1. Ajouter CSV dans** **`/data`
2. Ajouter un mapping dans** **`buildColumnMap(headers, year)`
3. Vérifier les colonnes statiques
4. Tester** **`/api/master/:id/2025`

## 10.2. Modifier les styles

`/styles/main.css`

## 10.3. Modifier les graphiques

`/module/VizManager.js`

## 10.4. Modifier les comportements

`/module/Orchestrator.js`

# 11. Liens importants

**Dépôt GitHub**
[https://github.com/Shii0te/SAE301-303.git](https://github.com/Shii0te/SAE301-303.git)
