# Spécification — Module d'onboarding "Solide / Bon / Faible / Inconnu"

**Pour :** RevTracker PEBC (App.jsx, Vite + React 18 + Tailwind)
**Auteur :** Isaac (PharmD, prép PEBC 15 oct 2026)
**Statut :** Spec finale, prête à implémenter
**Date :** 30 avril 2026

---

## 1. Objectif

Permettre une auto-évaluation initiale rapide des 168 sujets PEBC pour **calibrer la priorité** de chaque sujet dans le planning d'étude. L'onboarding ne modifie **pas la confiance** (qui reste à 1/5 partout) ni le statut (qui reste à `pas_commence` partout). Il fixe uniquement un nouveau champ `priorite_onboarding` qui pondère la sélection des sujets dans le moteur de recommandations.

---

## 2. Architecture des données

### 2.1 Nouveau champ sur chaque sujet

Ajouter un champ `priorite_onboarding` au modèle Sujet :

```javascript
{
  // ...champs existants
  priorite_onboarding: null  // null par défaut. Valeurs possibles après onboarding :
                              // "solide" | "bon" | "faible" | "inconnu"
}
```

**Important :** ne PAS modifier le champ `priorite` existant (qui reste critique/important/secondaire selon le blueprint PEBC). On ajoute un champ séparé pour ne pas casser la logique existante.

### 2.2 Nouveau bloc dans `settings`

```javascript
settings: {
  // ...champs existants
  onboarding: {
    statut: "non_commence" | "en_cours" | "termine",
    etape: "categories" | "affinage" | "termine",
    indexCategorieActuelle: 0,        // 0 à 35
    niveauxCategorie: {},              // { "Cardiovascular Disorders": "solide", ... }
    categoriesAFiner: [],              // liste des catégories "bon" ou "faible" à affiner
    indexCategorieAffinage: 0,         // 0 à categoriesAFiner.length
    indexSujetAffinage: 0,             // index du sujet en cours dans la catégorie
    dateDebut: null,                    // ISO string
    dateFin: null                       // ISO string
  }
}
```

### 2.3 Migration des données existantes

Au chargement de l'app, après le `LOAD_DATA` :
- Si `settings.onboarding` est absent → l'initialiser avec `{ statut: "non_commence", ... }`
- Si des sujets existants n'ont pas le champ `priorite_onboarding` → le rajouter avec `null`

---

## 3. Comportement de déclenchement

### 3.1 Lancement automatique au premier démarrage

**Condition :** `settings.onboarding.statut === "non_commence"` ET aucune révision n'a jamais été enregistrée (= `motivation.historiqueJournalier.length === 0` ET `state.sujets.every(s => !s.dateDerniereRevision)`).

**Action :** afficher la modale de bienvenue + onboarding au-dessus du dashboard, dès que `state.loaded === true`.

### 3.2 Modale de bienvenue

Avant de commencer, une première modale présente l'onboarding :

> **Bienvenue dans RevTracker**
>
> Avant de commencer, prenons 10-15 minutes pour calibrer ta préparation.
>
> Tu vas évaluer ton niveau **catégorie par catégorie** sur les 36 catégories du blueprint PEBC, puis affiner certaines zones sujet par sujet.
>
> **Important :** ta confiance reste à 1/5 partout — l'onboarding sert uniquement à **prioriser** les sujets dans tes futures révisions. Tu confirmeras ton vrai niveau au fil des révisions.
>
> [ Commencer ] [ Plus tard ]

Si "Plus tard" → la modale disparaît, mais une bannière persistante s'affiche en haut du dashboard : *"Onboarding non commencé — Démarrer"*.

### 3.3 Reprise interruptible

Si `settings.onboarding.statut === "en_cours"` au chargement → afficher une bannière sur le dashboard :

> **Onboarding en cours** — étape X/36 (catégories) ou X/Y (affinage). [ Reprendre ] [ Terminer plus tard ]

Pas de relance automatique de la modale, mais un bouton clair pour reprendre.

### 3.4 Refaire l'onboarding (depuis Paramètres)

Nouveau bouton dans la section "Zone de danger" des Paramètres :

> **Refaire l'onboarding**
>
> Cette action réinitialise toutes tes priorités d'onboarding. Tes confiances, statuts et révisions sont conservés.

Triple confirmation requise :

1. **Modale 1 :** "Veux-tu vraiment refaire l'onboarding ? Toutes les priorités seront effacées."
2. **Modale 2 :** "Confirme une seconde fois. Cette action ne peut pas être annulée par Undo (au-delà de 30s)."
3. **Étape 3 (automatique) :** export JSON automatique du state complet → fichier téléchargé localement avec nom `revtracker-backup-pre-onboarding-YYYY-MM-DD.json`. Le téléchargement déclenche `dispatch({ type: "TOAST", payload: { message: "Sauvegarde téléchargée ✓" } })`.
4. **Modale 3 :** "Sauvegarde téléchargée. Cliquer pour confirmer le redémarrage de l'onboarding."

Seulement après ces 3 confirmations + export, on dispatch `RESET_ONBOARDING`.

---

## 4. Étape 1 : évaluation par catégorie (~5 min)

### 4.1 Interface

Modale plein écran (composant `OnboardingModal`), une catégorie à la fois.

```
┌─────────────────────────────────────────────────┐
│  Onboarding — Catégorie 12/36                   │
│  ────────────────────────────────────────────  │
│                                                  │
│  Cardiovascular Disorders                       │
│  10 sujets dans cette catégorie                 │
│                                                  │
│  Domaine : Pratique pharmaceutique (55%)        │
│                                                  │
│  Quel est ton niveau global sur cette zone ?    │
│                                                  │
│  [ Solide ]  [ Bon ]  [ Faible ]  [ Inconnu ]  │
│                                                  │
│  ────────────────────────────────────────────  │
│  [ ← Retour ]              [ Pause ]             │
└─────────────────────────────────────────────────┘
```

### 4.2 Définitions affichées au survol

Tooltip ou texte d'aide sous les boutons :

- **Solide** : "Je connais bien, je pourrais traiter une question d'examen sans révision lourde."
- **Bon** : "J'ai des bases solides, mais quelques zones à rafraîchir."
- **Faible** : "J'ai des notions, mais beaucoup à revoir."
- **Inconnu** : "Je ne maîtrise pas, ou jamais étudié sérieusement."

### 4.3 Action sur clic

Au clic sur un niveau :
1. Stocker le choix dans `settings.onboarding.niveauxCategorie[categorie] = niveau`
2. Si la catégorie est "Bon" ou "Faible" → l'ajouter à `categoriesAFiner`
3. Pour TOUS les sujets de cette catégorie → `priorite_onboarding = niveau`
4. Incrémenter `indexCategorieActuelle`
5. Si toutes les catégories sont faites → passer à `etape: "affinage"` (ou `"termine"` si rien à affiner)
6. `dispatch({ type: "ONBOARDING_NEXT_CATEGORY" })` — sauvegarde automatique via `sv()`

### 4.4 Bouton retour

Permet de revenir à la catégorie précédente. Le niveau précédemment choisi est rechargé. Permet de corriger une erreur.

### 4.5 Bouton pause

Ferme la modale. `settings.onboarding.statut` reste à `"en_cours"`. La bannière de reprise apparaît sur le dashboard.

---

## 5. Étape 2 : affinage des catégories partielles (~10 min)

Optionnel mais proposé.

### 5.1 Modale de transition

Après les 36 catégories :

> **Catégories de base évaluées ✓**
>
> Tu as marqué N catégories en "Bon" ou "Faible". Veux-tu les affiner sujet par sujet ? Cela rendra ton planning plus précis.
>
> [ Affiner maintenant ]  [ Terminer (garder le niveau catégorie) ]

Si "Terminer" → `etape: "termine"`, dispatch `ONBOARDING_COMPLETE`. Tous les sujets gardent le niveau de leur catégorie.

### 5.2 Interface d'affinage

Pour chaque catégorie de `categoriesAFiner`, balayage des sujets un par un.

```
┌─────────────────────────────────────────────────┐
│  Affinage — Cardiovascular Disorders (3/8)      │
│  Sujet 4/10                                      │
│  ────────────────────────────────────────────  │
│                                                  │
│  Insuffisance cardiaque                         │
│                                                  │
│  Notes du sujet :                                │
│  4 piliers HFrEF : ARNI/IECA, BB, ARM, iSGLT2.  │
│  Diurétiques, digoxine. NYHA classification.    │
│                                                  │
│  Ton niveau ?                                    │
│  [ Solide ]  [ Bon ]  [ Faible ]  [ Inconnu ]  │
│                                                  │
│  ────────────────────────────────────────────  │
│  [ ← Retour ]  [ Garder niveau catégorie ]       │
│                              [ Pause ]            │
└─────────────────────────────────────────────────┘
```

Le bouton "Garder niveau catégorie" permet de skipper rapidement un sujet (il garde le niveau hérité de la catégorie).

### 5.3 Logique de fin

Quand tous les sujets de toutes les catégories à affiner sont passés :
1. `etape: "termine"`
2. `statut: "termine"`
3. `dateFin = new Date().toISOString()`
4. Modale de félicitations :

> **Onboarding terminé ✓**
>
> Tu as évalué tes 168 sujets en X minutes. Tes priorités sont calibrées.
>
> Rappel : ta confiance reste à 1/5. Au fil de tes vraies révisions, l'app affinera tes scores.
>
> [ Aller au tableau de bord ]

---

## 6. Intégration dans la logique existante

### 6.1 Moteur de recommandations (`gsr`)

Modifier la fonction `gsr` (ligne ~390 dans App.jsx) pour ajouter un facteur basé sur `priorite_onboarding` :

```javascript
const gsr = (sujets, n = 8) => {
  const sc = sujets.map(s => {
    let score = 0;
    if (isOv(s)) score += 100 + db(s.dateProchaineRevision, new Date().toISOString());
    else if (isDT(s)) score += 50;
    if (s.statut === "pas_commence") score += 30;
    if (s.priorite === "critique") score += 20;
    else if (s.priorite === "important") score += 10;
    score += (5 - s.confiance) * 5;
    if (!s.dateDerniereRevision) score += 15;

    // NOUVEAU : priorité d'onboarding
    if (s.priorite_onboarding === "inconnu") score += 25;
    else if (s.priorite_onboarding === "faible") score += 18;
    else if (s.priorite_onboarding === "bon") score += 8;
    else if (s.priorite_onboarding === "solide") score -= 10;  // déprioriser
    // si null : pas de modification

    return { ...s, _s: score };
  });
  return _.orderBy(sc, "_s", "desc").slice(0, n);
};
```

**Logique :**
- "Inconnu" : +25 (priorité maximale, à voir vite)
- "Faible" : +18 (priorité haute)
- "Bon" : +8 (priorité moyenne, sera vu en temps voulu)
- "Solide" : −10 (rétrograde, à voir mais sans urgence)

### 6.2 Vue Sujets : nouveau filtre

Dans la vue Sujets (composant `SV`), ajouter un nouveau filtre dans la barre de filtres :

```jsx
<select onChange={...}>
  <option value="">Toutes les priorités onboarding</option>
  <option value="inconnu">Inconnu</option>
  <option value="faible">Faible</option>
  <option value="bon">Bon</option>
  <option value="solide">Solide</option>
  <option value="null">Non évalué</option>
</select>
```

Et un badge compact dans la table/kanban à côté de la colonne priorité existante :

```jsx
{s.priorite_onboarding && (
  <Bg className={...}>{s.priorite_onboarding[0].toUpperCase()}</Bg>
)}
```

Couleurs des badges :
- Solide : vert (#059669)
- Bon : bleu (#2563EB)
- Faible : orange (#D97706)
- Inconnu : rouge (#DC2626)

### 6.3 Dashboard : indicateur de calibration

Nouveau KPI sur le dashboard :

```
┌────────────────────────────────────────┐
│  Calibration                            │
│  ────────────────────────────────────  │
│  Solide   : 42 sujets (25%)            │
│  Bon      : 38 sujets (23%)            │
│  Faible   : 51 sujets (30%)            │
│  Inconnu  : 37 sujets (22%)            │
└────────────────────────────────────────┘
```

À afficher seulement si `settings.onboarding.statut === "termine"`. Sinon, afficher une carte d'invitation à faire l'onboarding.

---

## 7. Reducer : nouvelles actions

```javascript
case "ONBOARDING_START": {
  return {
    ...state,
    settings: {
      ...state.settings,
      onboarding: {
        statut: "en_cours",
        etape: "categories",
        indexCategorieActuelle: 0,
        niveauxCategorie: {},
        categoriesAFiner: [],
        indexCategorieAffinage: 0,
        indexSujetAffinage: 0,
        dateDebut: new Date().toISOString(),
        dateFin: null
      }
    }
  };
}

case "ONBOARDING_SET_CATEGORY_LEVEL": {
  const { categorie, niveau } = action.payload;
  const sujetsMaJ = state.sujets.map(s =>
    s.categorie === categorie ? { ...s, priorite_onboarding: niveau } : s
  );
  const niveauxMaJ = { ...state.settings.onboarding.niveauxCategorie, [categorie]: niveau };
  const aFiner = state.settings.onboarding.categoriesAFiner.filter(c => c !== categorie);
  if (niveau === "bon" || niveau === "faible") aFiner.push(categorie);
  return {
    ...state,
    sujets: sujetsMaJ,
    settings: {
      ...state.settings,
      onboarding: {
        ...state.settings.onboarding,
        niveauxCategorie: niveauxMaJ,
        categoriesAFiner: aFiner,
        indexCategorieActuelle: state.settings.onboarding.indexCategorieActuelle + 1
      }
    }
  };
}

case "ONBOARDING_GO_BACK_CATEGORY": {
  const idx = Math.max(0, state.settings.onboarding.indexCategorieActuelle - 1);
  return {
    ...state,
    settings: {
      ...state.settings,
      onboarding: { ...state.settings.onboarding, indexCategorieActuelle: idx }
    }
  };
}

case "ONBOARDING_START_REFINING": {
  return {
    ...state,
    settings: {
      ...state.settings,
      onboarding: {
        ...state.settings.onboarding,
        etape: state.settings.onboarding.categoriesAFiner.length > 0 ? "affinage" : "termine",
        statut: state.settings.onboarding.categoriesAFiner.length > 0 ? "en_cours" : "termine",
        indexCategorieAffinage: 0,
        indexSujetAffinage: 0,
        dateFin: state.settings.onboarding.categoriesAFiner.length > 0 ? null : new Date().toISOString()
      }
    }
  };
}

case "ONBOARDING_SET_SUBJECT_LEVEL": {
  const { sujetId, niveau } = action.payload;
  const sujetsMaJ = state.sujets.map(s =>
    s.id === sujetId ? { ...s, priorite_onboarding: niveau } : s
  );
  return {
    ...state,
    sujets: sujetsMaJ
  };
}

case "ONBOARDING_NEXT_REFINING": {
  // Avance dans l'affinage : sujet suivant ou catégorie suivante
  const ob = state.settings.onboarding;
  const cat = ob.categoriesAFiner[ob.indexCategorieAffinage];
  const sujetsCat = state.sujets.filter(s => s.categorie === cat);
  let { indexCategorieAffinage, indexSujetAffinage } = ob;
  indexSujetAffinage++;
  if (indexSujetAffinage >= sujetsCat.length) {
    indexSujetAffinage = 0;
    indexCategorieAffinage++;
  }
  const fini = indexCategorieAffinage >= ob.categoriesAFiner.length;
  return {
    ...state,
    settings: {
      ...state.settings,
      onboarding: {
        ...ob,
        indexCategorieAffinage,
        indexSujetAffinage,
        etape: fini ? "termine" : "affinage",
        statut: fini ? "termine" : "en_cours",
        dateFin: fini ? new Date().toISOString() : null
      }
    }
  };
}

case "ONBOARDING_PAUSE": {
  // Ferme la modale sans changer le statut (qui reste "en_cours")
  return state;  // pas de changement, la modale est contrôlée par état local du composant
}

case "ONBOARDING_COMPLETE": {
  return {
    ...state,
    settings: {
      ...state.settings,
      onboarding: {
        ...state.settings.onboarding,
        statut: "termine",
        etape: "termine",
        dateFin: new Date().toISOString()
      }
    }
  };
}

case "RESET_ONBOARDING": {
  // Réinitialise priorite_onboarding à null sur tous les sujets
  // ET réinitialise settings.onboarding à l'état initial
  return {
    ...state,
    sujets: state.sujets.map(s => ({ ...s, priorite_onboarding: null })),
    settings: {
      ...state.settings,
      onboarding: { statut: "non_commence", etape: "categories", indexCategorieActuelle: 0, niveauxCategorie: {}, categoriesAFiner: [], indexCategorieAffinage: 0, indexSujetAffinage: 0, dateDebut: null, dateFin: null }
    }
  };
}
```

---

## 8. Composants à créer

### 8.1 `OnboardingModal`

Composant principal qui s'affiche tant que `settings.onboarding.statut === "en_cours"` et que l'utilisateur n'a pas cliqué sur "Pause".

Logique interne :
- Si `etape === "categories"` → affiche `OnboardingCategoryStep`
- Si `etape === "affinage"` → affiche `OnboardingRefineStep`
- Si `etape === "termine"` → affiche `OnboardingCompleteStep` puis se ferme

### 8.2 `OnboardingWelcomeModal`

Modale de bienvenue qui apparaît au tout premier démarrage. Boutons "Commencer" (dispatch `ONBOARDING_START`) ou "Plus tard".

### 8.3 `OnboardingResumeBanner`

Bannière persistante sur le dashboard tant que `statut !== "termine"`. Boutons "Démarrer" ou "Reprendre" selon l'état.

### 8.4 `CalibrationKPI`

KPI sur le dashboard, affiché seulement si onboarding terminé. Récap des 4 niveaux avec couleurs.

### 8.5 `RestartOnboardingFlow`

Composant dans Paramètres qui orchestre la triple confirmation + export JSON automatique avant `RESET_ONBOARDING`.

---

## 9. Tests à effectuer après implémentation

1. **Premier démarrage (état vierge) :** la modale de bienvenue s'affiche.
2. **Étape catégories complète sans interruption :** 36 catégories balayées, on arrive à l'écran de transition affinage.
3. **Étape catégories interrompue (clic Pause) :** la modale se ferme, la bannière "Reprendre" apparaît sur le dashboard, au refresh la position est conservée.
4. **Étape affinage skipée :** clic "Terminer" sur la modale de transition → onboarding marqué terminé, niveaux catégorie hérités.
5. **Étape affinage complète :** tous les sujets des catégories partielles sont balayés, l'écran de fin s'affiche.
6. **Vérification post-onboarding :** dans la vue Sujets, le filtre "priorité onboarding" fonctionne, les badges s'affichent.
7. **Vérification du moteur de recommandations :** après onboarding, les sujets "inconnu" remontent en priorité dans le dashboard "Recommandations du jour".
8. **Refaire l'onboarding :** triple confirmation, export JSON déclenché, état réinitialisé.
9. **Confiance préservée :** vérifier qu'aucun sujet n'a sa confiance modifiée après onboarding (toujours 1/5).
10. **Build :** `npm run build` réussit sans erreur, déploiement Vercel OK.

---

## 10. Workflow Git recommandé

Travailler en **commits petits et ciblés** :

- Commit 1 : "Ajout du champ priorite_onboarding et settings.onboarding (data model)"
- Commit 2 : "Ajout des actions reducer pour l'onboarding"
- Commit 3 : "Composant OnboardingWelcomeModal"
- Commit 4 : "Composant OnboardingCategoryStep"
- Commit 5 : "Composant OnboardingRefineStep + transition"
- Commit 6 : "Composant OnboardingCompleteStep et flow complet"
- Commit 7 : "Intégration : déclenchement automatique au premier démarrage"
- Commit 8 : "Intégration : modification de gsr (moteur de recommandations)"
- Commit 9 : "Intégration : filtre dans la vue Sujets + badges"
- Commit 10 : "Intégration : KPI Calibration sur dashboard"
- Commit 11 : "Refaire l'onboarding (triple confirmation + export JSON)"
- Commit 12 : "Tests, ajustements UX, build final"

Tester `npm run build` après chaque commit. Pousser sur GitHub seulement quand le build passe.

---

## 11. Hors scope (à faire plus tard)

- Sync Google Drive du state d'onboarding (sera fait dans la spec sync à venir)
- Re-onboarding partiel (ex : "refaire seulement la catégorie Cardio") — peut être ajouté en V2 si besoin
- Statistiques d'évolution des priorités onboarding au fil du temps
- Export PDF du rapport d'onboarding

