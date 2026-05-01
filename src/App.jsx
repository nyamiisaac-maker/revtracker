import { useState, useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LayoutDashboard, List, CalendarDays, BarChart3, Play, Settings, Plus, Pencil, Trash2,
  Check, X, Search, Filter, Download, Upload, Circle, Clock, CheckCircle2, AlertTriangle,
  Sun, Moon, Flame, Trophy, Target, ExternalLink, BookOpen, ChevronUp, ChevronDown, Star,
  Pause, SkipForward, ArrowRight, Menu, RotateCcw, Columns3, Timer, Zap, Brain, TrendingUp,
  Activity, Heart, Coffee, AlertCircle, Award, Undo2, Map, Flag, ClipboardCheck,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, Area, AreaChart, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import _ from "lodash";

// ============================================================================
// MAPPING PLAN V3 : semainePlan (1-26) pour chaque sujet
// Semaine 0 = non planifié explicitement (à intégrer Phases 5-6 ou opportunément)
// ============================================================================
const SEMAINE_PLAN = {
  // Phase 1 - Fondations (S1-S4)
  "pebc-001": 2, "pebc-002": 2, "pebc-003": 2, "pebc-004": 2, "pebc-005": 2, "pebc-006": 2, "pebc-007": 2,
  "pebc-008": 3, "pebc-009": 3, "pebc-010": 3, "pebc-011": 3, "pebc-012": 3, "pebc-013": 3,
  "pebc-023": 4, "pebc-024": 4, "pebc-025": 4, "pebc-026": 4, "pebc-027": 4, "pebc-028": 4,
  "pebc-035": 4, "pebc-036": 4,
  // Phase 2 - Pharmacothérapie core (S5-S12)
  "pebc-014": 5, "pebc-037": 5, "pebc-038": 5, "pebc-041": 5,
  "pebc-039": 6, "pebc-040": 6, "pebc-042": 6, "pebc-043": 6,
  "pebc-044": 7, "pebc-045": 7, "pebc-046": 7, "pebc-029": 7,
  "pebc-016": 8, "pebc-031": 8, "pebc-080": 8, "pebc-081": 8,
  "pebc-082": 9, "pebc-083": 9, "pebc-086": 9, "pebc-087": 9,
  "pebc-088": 10, "pebc-089": 10, "pebc-091": 10, "pebc-094": 10,
  "pebc-015": 11, "pebc-030": 11, "pebc-054": 11, "pebc-055": 11,
  "pebc-017": 12, "pebc-032": 12, "pebc-114": 12, "pebc-115": 12,
  // Phase 3 - Complémentaire (S13-S18)
  "pebc-018": 13, "pebc-033": 13, "pebc-124": 13, "pebc-125": 13, "pebc-127": 13,
  "pebc-126": 14, "pebc-129": 14, "pebc-131": 14, "pebc-132": 14, "pebc-128": 14,
  "pebc-060": 15, "pebc-061": 15, "pebc-062": 15, "pebc-101": 15, "pebc-102": 15,
  "pebc-103": 16, "pebc-104": 16, "pebc-106": 16, "pebc-068": 16, "pebc-069": 16,
  "pebc-138": 17, "pebc-139": 17, "pebc-140": 17, "pebc-072": 17, "pebc-070": 17, "pebc-071": 17,
  "pebc-146": 18, "pebc-147": 18, "pebc-141": 18, "pebc-142": 18, "pebc-143": 18, "pebc-144": 18,
  // Phase 4 - BSA + Canada (S19-S22)
  "pebc-164": 19, "pebc-165": 19, "pebc-166": 19,
  "pebc-167": 20, "pebc-168": 20, "pebc-160": 20, "pebc-150": 20,
  "pebc-158": 21, "pebc-159": 21, "pebc-156": 21, "pebc-157": 21,
  "pebc-153": 22, "pebc-154": 22, "pebc-155": 22, "pebc-161": 22, "pebc-162": 22, "pebc-163": 22,
};

// ============================================================================
// PHASES DU PLAN V3 — utilisé pour l'affichage groupé dans la vue Plan
// ============================================================================
const PHASES_PLAN = [
  { id: 1, numero: 1, nom: "Cadrage & Fondations", semaines: [1, 2, 3, 4], heures: 50, couleur: "#8B5CF6", focus: "Setup, auto-diagnostic, sciences pharmaceutiques de base" },
  { id: 2, numero: 2, nom: "Pharmacothérapie Core", semaines: [5, 6, 7, 8, 9, 10, 11, 12], heures: 100, couleur: "#2563EB", focus: "Cardio, infectieux, endocrine, psychiatrie" },
  { id: 3, numero: 3, nom: "Pharmacothérapie Complémentaire", semaines: [13, 14, 15, 16, 17, 18], heures: 70, couleur: "#059669", focus: "Rénal, GI, neuro, respi, populations spéciales, calculs" },
  { id: 4, numero: 4, nom: "BSA + Canada", semaines: [19, 20, 21, 22], heures: 55, couleur: "#D97706", focus: "Système de santé, éthique, équité, santé autochtone" },
  { id: 5, numero: 5, nom: "Intégration & QCM", semaines: [23, 24], heures: 30, couleur: "#DC2626", focus: "Révisions intensives + Examen blanc #1" },
  { id: 6, numero: 6, nom: "Révision Finale", semaines: [25, 26], heures: 20, couleur: "#6B7280", focus: "Sujets fragiles + Examen blanc #2 + J-J" },
];

// ============================================================================
// CHECKPOINTS DU PLAN V3
// ============================================================================
const CHECKPOINTS_DEF = [
  {
    id: "s4", semaine: 4, titre: "Checkpoint S4 — Fin des fondations",
    questions: [
      { id: "s4-q1", label: "Les 7 concepts de pharmaceutics (001-007) sont-ils solides ?" },
      { id: "s4-q2", label: "ADME et interactions PK/PD (008-011) sont-ils maîtrisés ?" },
      { id: "s4-q3", label: "Toxicologie de base et antidotes (023-025) sont-ils revus ?" },
      { id: "s4-q4", label: "Interprétation des labos (035-036) est-elle acquise ?" },
      { id: "s4-q5", label: "Confiance moyenne de la phase 1 ≥ 3/5 ?" },
      { id: "s4-q6", label: "As-tu tenu le rythme de 12,5 h/sem cette phase ?" },
      { id: "s4-q7", label: "Ressources et workflow d'étude sont-ils en place ?" },
    ],
  },
  {
    id: "s10", semaine: 10, titre: "Checkpoint S10 — Décision pré-inscription",
    questions: [
      { id: "s10-q1", label: "Phases 1-2 core (cardio + infectieux) couvertes à ≥ 80% ?" },
      { id: "s10-q2", label: "Confiance moyenne globale ≥ 2,5/5 ?" },
      { id: "s10-q3", label: "Sujets en retard < 15% du total ?" },
      { id: "s10-q4", label: "Pas de sujet fragile critique non-traité ?" },
      { id: "s10-q5", label: "Trajectoire : dans les temps pour le plan v3 ?" },
      { id: "s10-q6", label: "État de santé, sommeil, charge de travail : soutenables ?" },
      { id: "s10-q7", label: "Décision : je confirme l'inscription du 16 juillet ?" },
      { id: "s10-q8", label: "Budget (910 $ examen + 195 $ CPS) sécurisé ?" },
    ],
  },
  {
    id: "s16", semaine: 16, titre: "Checkpoint S16 — Bilan Phase 3",
    questions: [
      { id: "s16-q1", label: "Rénal, GI, neuro couverts ?" },
      { id: "s16-q2", label: "Populations spéciales (grossesse, gériatrie, pédiatrie) abordées ?" },
      { id: "s16-q3", label: "Calculs de dosage et débit : pratiqués régulièrement ?" },
      { id: "s16-q4", label: "Confiance moyenne Phases 1-3 ≥ 3/5 ?" },
      { id: "s16-q5", label: "Abonnement CPS activé et utilisé ?" },
      { id: "s16-q6", label: "Progression cohérente avec le timeline examen 15 oct ?" },
      { id: "s16-q7", label: "Ajustements nécessaires pour Phase 4 identifiés ?" },
    ],
  },
];

// ============================================================================
// SUJETS PAR DÉFAUT — 168 sujets PEBC avec semainePlan intégré
// ============================================================================
const RAW_SUBJECTS = [
  { "id": "pebc-001", "nom": "Propriétés physico-chimiques des médicaments", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["pré-formulation", "physico-chimie"], "priorite": "important", "notes": "Point de fusion, solubilité, viscosité, dissolution, propriétés des particules et de l'état solide." },
  { "id": "pebc-002", "nom": "Formes galéniques : solutions, poudres, colloïdes, dispersions, émulsions", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["formes-galéniques", "formulation"], "priorite": "important", "notes": "Propriétés, avantages et limites de chaque forme liquide/semi-liquide." },
  { "id": "pebc-003", "nom": "Formes galéniques : semi-solides, suppositoires, comprimés, gélules", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["formes-galéniques", "formulation"], "priorite": "important", "notes": "Biopharmaceutique de chaque forme solide. Facteurs affectant la dissolution et la biodisponibilité." },
  { "id": "pebc-004", "nom": "Formes galéniques : injectables, topiques, patchs, dispositifs d'inhalation", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["formes-galéniques", "voies-administration"], "priorite": "critique", "notes": "Questions fréquentes sur les voies d'administration et leurs indications cliniques spécifiques." },
  { "id": "pebc-005", "nom": "Principes de formulation et BPF (Bonnes Pratiques de Fabrication)", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["BPF", "qualité", "stabilité"], "priorite": "secondaire", "notes": "Développement de produits, tests de stabilité, contrôle qualité." },
  { "id": "pebc-006", "nom": "Systèmes de délivrance et voies d'administration en contexte clinique", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["drug-delivery", "clinique"], "priorite": "critique", "notes": "Application clinique : choisir le bon système pour le bon patient et la bonne situation." },
  { "id": "pebc-007", "nom": "Bioéquivalence des génériques et produits biopharmaceutiques", "categorie": "Pharmaceutics & Drug Delivery", "tags": ["bioéquivalence", "génériques", "biopharma"], "priorite": "important", "notes": "Critères de bioéquivalence, biologiques vs biosimilaires, interchangeabilité." },
  { "id": "pebc-008", "nom": "ADME : absorption, distribution, métabolisme, élimination", "categorie": "Pharmacokinetics & Biopharmaceutics", "tags": ["ADME", "PK-fondamentaux"], "priorite": "critique", "notes": "Base de toute la PK. Maîtriser chaque étape, facteurs influençant chacune." },
  { "id": "pebc-009", "nom": "Principes PK appliqués au dosage et au monitoring thérapeutique", "categorie": "Pharmacokinetics & Biopharmaceutics", "tags": ["dosage", "TDM", "monitoring"], "priorite": "critique", "notes": "Maximiser efficacité, minimiser toxicité. Aminosides, vancomycine, digoxine, lithium, phénytoïne." },
  { "id": "pebc-010", "nom": "Mécanismes PK/PD des interactions médicamenteuses", "categorie": "Pharmacokinetics & Biopharmaceutics", "tags": ["interactions", "PK-PD"], "priorite": "critique", "notes": "Inhibition/induction enzymatique (CYP450), déplacement de liaison protéique. Très testé." },
  { "id": "pebc-011", "nom": "Modèles PK et formules : démographiques, fonction organique, états pathologiques", "categorie": "Pharmacokinetics & Biopharmaceutics", "tags": ["modèles-PK", "calculs", "ajustement-dose"], "priorite": "important", "notes": "Cockcroft-Gault, CKD-EPI, ajustement en insuffisance rénale/hépatique." },
  { "id": "pebc-012", "nom": "Mécanismes d'action, dose-réponse, structure-activité", "categorie": "Pharmacology", "tags": ["mécanismes", "SAR", "dose-réponse"], "priorite": "critique", "notes": "Agonistes, antagonistes, puissance vs efficacité, récepteurs, ED50, LD50." },
  { "id": "pebc-013", "nom": "Interactions médicament-récepteur et conception rationnelle", "categorie": "Pharmacology", "tags": ["récepteurs", "drug-design"], "priorite": "important", "notes": "Types de récepteurs (GPCR, canaux ioniques, enzymes, nucléaires), signalisation cellulaire." },
  { "id": "pebc-014", "nom": "Pharmacologie cardiovasculaire", "categorie": "Pharmacology", "tags": ["cardio", "pharmacologie-systémique"], "priorite": "critique", "notes": "Antihypertenseurs, antiarythmiques, anticoagulants, statines, antiplaquettaires. Très représenté." },
  { "id": "pebc-015", "nom": "Pharmacologie endocrinienne", "categorie": "Pharmacology", "tags": ["endocrine", "pharmacologie-systémique"], "priorite": "critique", "notes": "Insulines (types, PK), ADO, hormones thyroïdiennes, corticoïdes systémiques." },
  { "id": "pebc-016", "nom": "Pharmacologie des maladies infectieuses", "categorie": "Pharmacology", "tags": ["anti-infectieux", "pharmacologie-systémique"], "priorite": "critique", "notes": "Mécanismes des antibiotiques, antifongiques, antiviraux, antiparasitaires. Spectres d'action." },
  { "id": "pebc-017", "nom": "Pharmacologie psychiatrique et neurologique", "categorie": "Pharmacology", "tags": ["psychiatrie", "neuro", "pharmacologie-systémique"], "priorite": "critique", "notes": "Antidépresseurs, antipsychotiques, anxiolytiques, antiépileptiques, antiparkinsoniens." },
  { "id": "pebc-018", "nom": "Pharmacologie respiratoire, GI, rénale", "categorie": "Pharmacology", "tags": ["respi", "GI", "rénal", "pharmacologie-systémique"], "priorite": "important", "notes": "Bronchodilatateurs (BACA/BALA), CSI, IPP, anti-H2, diurétiques." },
  { "id": "pebc-019", "nom": "Pharmacologie musculosquelettique, dermatologique, ophtalmique", "categorie": "Pharmacology", "tags": ["MSK", "dermato", "ophtalmo"], "priorite": "important", "notes": "AINS (mécanismes COX-1/COX-2), corticoïdes topiques, collyres antiglaucomateux." },
  { "id": "pebc-020", "nom": "Pharmacologie oncologique et hématologique", "categorie": "Pharmacology", "tags": ["onco", "hémato"], "priorite": "important", "notes": "Principes de chimiothérapie (alkylants, antimétabolites), anticoagulants, antiplaquettaires." },
  { "id": "pebc-021", "nom": "Analgésiques et drogues d'abus", "categorie": "Pharmacology", "tags": ["douleur", "abus", "opioïdes"], "priorite": "critique", "notes": "Opioïdes (mu, kappa, delta), AINS, acétaminophène, substances contrôlées au Canada." },
  { "id": "pebc-022", "nom": "Effets des modifications structurales sur puissance, formulation et PK", "categorie": "Pharmacology", "tags": ["SAR", "medicinal-chemistry"], "priorite": "secondaire", "notes": "Différences intra-classe : statines hydrophiles vs lipophiles, BB sélectifs vs non sélectifs." },
  { "id": "pebc-023", "nom": "Toxicologie des médicaments Rx, OTC et drogues d'abus", "categorie": "Toxicology", "tags": ["toxicologie", "empoisonnement"], "priorite": "important", "notes": "Syndromes toxiques : anticholinergique, sérotoninergique, opioïde, sympathomimétique." },
  { "id": "pebc-024", "nom": "Pertinence clinique de la toxicologie et pharmacogénomique", "categorie": "Toxicology", "tags": ["pharmacogénomique", "toxicologie"], "priorite": "important", "notes": "CYP2D6, CYP2C19, HLA-B*5801, TPMT — métaboliseurs lents/rapides." },
  { "id": "pebc-025", "nom": "Prise en charge des intoxications et surdosages", "categorie": "Toxicology", "tags": ["antidotes", "overdose", "urgence"], "priorite": "critique", "notes": "Antidotes : N-acétylcystéine (APAP), naloxone (opioïdes), flumazénil (BZD), charbon activé." },
  { "id": "pebc-026", "nom": "Technologies de production des produits biologiques", "categorie": "Biotechnology & Pharmacogenetics", "tags": ["biotechnologie", "biologiques"], "priorite": "secondaire", "notes": "ADN recombinant, anticorps monoclonaux, vaccins recombinants." },
  { "id": "pebc-027", "nom": "Considérations pharmaceutiques des produits biotechnologiques", "categorie": "Biotechnology & Pharmacogenetics", "tags": ["biosimilaires", "stabilité", "cold-chain"], "priorite": "important", "notes": "Stockage (chaîne du froid), immunogénicité, interchangeabilité des biosimilaires." },
  { "id": "pebc-028", "nom": "Thérapie personnalisée et pharmacogénétique", "categorie": "Biotechnology & Pharmacogenetics", "tags": ["pharmacogénétique", "médecine-personnalisée"], "priorite": "important", "notes": "Tests génétiques avant traitement : warfarine (VKORC1), codéine (CYP2D6), abacavir (HLA-B*5701)." },
  { "id": "pebc-029", "nom": "Physiopathologie cardiovasculaire", "categorie": "Pathophysiology", "tags": ["pathophysio", "cardio"], "priorite": "critique", "notes": "Athérosclérose, remodelage cardiaque, mécanismes d'arythmie, cascade de coagulation." },
  { "id": "pebc-030", "nom": "Physiopathologie endocrinienne", "categorie": "Pathophysiology", "tags": ["pathophysio", "endocrine"], "priorite": "critique", "notes": "Résistance à l'insuline, auto-immunité (DT1), boucle hypothalamo-hypophysaire, thyroïde." },
  { "id": "pebc-031", "nom": "Physiopathologie des maladies infectieuses", "categorie": "Pathophysiology", "tags": ["pathophysio", "infectieux"], "priorite": "critique", "notes": "Réponse immunitaire, virulence, résistance bactérienne, sepsis/SIRS." },
  { "id": "pebc-032", "nom": "Physiopathologie psychiatrique et neurologique", "categorie": "Pathophysiology", "tags": ["pathophysio", "neuro", "psychiatrie"], "priorite": "important", "notes": "Hypothèses monoaminergiques, neurodégénérescence, excitotoxicité." },
  { "id": "pebc-033", "nom": "Physiopathologie GI, rénale, respiratoire", "categorie": "Pathophysiology", "tags": ["pathophysio", "GI", "rénal", "respi"], "priorite": "important", "notes": "Fibrose hépatique, néphron et filtration glomérulaire, bronchospasme, inflammation des voies aériennes." },
  { "id": "pebc-034", "nom": "Physiopathologie dermatologique, MSK, ophtalmique", "categorie": "Pathophysiology", "tags": ["pathophysio", "dermato", "MSK", "ophtalmo"], "priorite": "secondaire", "notes": "Kératinocytes et psoriasis, cartilage et arthrose, pression intraoculaire et glaucome." },
  { "id": "pebc-035", "nom": "Interprétation des résultats de laboratoire", "categorie": "Clinical Biochemistry & Lab Testing", "tags": ["labos", "biochimie", "interprétation"], "priorite": "critique", "notes": "A1C, créatinine, DFG, ALT/AST, INR, TSH, FSC, électrolytes, troponine, BNP. Très testé." },
  { "id": "pebc-036", "nom": "Tests au point de soins et approche diagnostique", "categorie": "Clinical Biochemistry & Lab Testing", "tags": ["POCT", "diagnostic"], "priorite": "important", "notes": "Glucomètre, tests rapides (strep, COVID), INR capillaire, bandelette urinaire." },
  { "id": "pebc-037", "nom": "Syndromes coronariens aigus (STEMI, NSTEMI, angine instable)", "categorie": "Cardiovascular Disorders", "tags": ["SCA", "urgence", "cardio"], "priorite": "critique", "notes": "Double antiplaquettaire (ASA + ticagrélor/prasugrel), héparine, thrombolyse/ICP." },
  { "id": "pebc-038", "nom": "Prévention CV primaire et secondaire (ASCVD)", "categorie": "Cardiovascular Disorders", "tags": ["prévention", "ASCVD", "statines"], "priorite": "critique", "notes": "Score de risque Framingham, statines haute intensité, ASA, cibles LDL CCS." },
  { "id": "pebc-039", "nom": "Arythmies : fibrillation atriale", "categorie": "Cardiovascular Disorders", "tags": ["FA", "arythmie", "anticoagulation"], "priorite": "critique", "notes": "CHADS2-VASc, HAS-BLED, AOD (rivaroxaban, apixaban, dabigatran) vs warfarine." },
  { "id": "pebc-040", "nom": "Dyslipidémies", "categorie": "Cardiovascular Disorders", "tags": ["lipides", "statines", "ézétimibe"], "priorite": "important", "notes": "Cibles LDL selon le risque, statines, ézétimibe, iPCSK9, hypertriglycéridémie." },
  { "id": "pebc-041", "nom": "Insuffisance cardiaque", "categorie": "Cardiovascular Disorders", "tags": ["IC", "HFrEF", "HFpEF"], "priorite": "critique", "notes": "4 piliers HFrEF : ARNI/IECA, BB, ARM, iSGLT2. Diurétiques, digoxine. NYHA classification." },
  { "id": "pebc-042", "nom": "Hypertension", "categorie": "Cardiovascular Disorders", "tags": ["HTA", "antihypertenseurs"], "priorite": "critique", "notes": "Cibles Hypertension Canada, choix selon comorbidités, urgence/urgence hypertensive." },
  { "id": "pebc-043", "nom": "Maladie ischémique cardiaque (angine stable)", "categorie": "Cardiovascular Disorders", "tags": ["angine", "ischémie"], "priorite": "important", "notes": "Nitrates (SL, patch), BB, BCC, prévention secondaire (statine, ASA, IECA)." },
  { "id": "pebc-044", "nom": "Maladie artérielle périphérique", "categorie": "Cardiovascular Disorders", "tags": ["MAP", "claudication"], "priorite": "secondaire", "notes": "Cilostazol, programme d'exercice, gestion facteurs de risque, revascularisation." },
  { "id": "pebc-045", "nom": "AVC ischémique, hémorragique, AIT", "categorie": "Cardiovascular Disorders", "tags": ["AVC", "AIT", "urgence"], "priorite": "critique", "notes": "tPA (fenêtre 4.5h), prévention secondaire (antiplaquettaire ou AOD si FA)." },
  { "id": "pebc-046", "nom": "Thromboembolie veineuse (TVP, EP)", "categorie": "Cardiovascular Disorders", "tags": ["TEV", "TVP", "EP", "anticoagulation"], "priorite": "critique", "notes": "AOD en première ligne, HBPM, durée de traitement, prophylaxie post-opératoire." },
  { "id": "pebc-047", "nom": "Acné vulgaire", "categorie": "Dermatologic Disorders", "tags": ["acné", "dermato"], "priorite": "important", "notes": "Rétinoïdes topiques, peroxyde de benzoyle, antibiotiques (topiques/oraux), isotrétinoïne." },
  { "id": "pebc-048", "nom": "Dermatites (atopique, contact, érythème fessier)", "categorie": "Dermatologic Disorders", "tags": ["dermatite", "eczéma"], "priorite": "important", "notes": "Émollients, corticoïdes topiques (puissance), inhibiteurs de calcineurine, dupilumab." },
  { "id": "pebc-049", "nom": "Psoriasis", "categorie": "Dermatologic Disorders", "tags": ["psoriasis", "dermato"], "priorite": "important", "notes": "Topiques (corticoïdes, vit D), photothérapie, MTX, biologiques (anti-TNF, anti-IL17, anti-IL23)." },
  { "id": "pebc-050", "nom": "Alopécie, rosacée, brûlures/plaies mineures", "categorie": "Dermatologic Disorders", "tags": ["alopécie", "rosacée", "soins-mineurs"], "priorite": "secondaire", "notes": "Minoxidil, finastéride, métronidazole topique, premiers soins." },
  { "id": "pebc-051", "nom": "Dermatoses médicamenteuses", "categorie": "Dermatologic Disorders", "tags": ["drug-induced", "dermato"], "priorite": "important", "notes": "SJS/TEN (allopurinol, carbamazépine, lamotrigine), DRESS, éruptions morbilliformes." },
  { "id": "pebc-052", "nom": "Rhinite allergique", "categorie": "ENT Disorders", "tags": ["allergie", "rhinite", "antihistaminiques"], "priorite": "important", "notes": "Corticoïdes intranasaux (1re ligne), anti-H1 2e gén, immunothérapie sublinguale." },
  { "id": "pebc-053", "nom": "Toux, mal de gorge, rhinorrhée, otite externe, cérumen", "categorie": "ENT Disorders", "tags": ["ORL", "soins-mineurs", "automédication"], "priorite": "important", "notes": "Rôle du pharmacien en triage, red flags, traitements OTC appropriés." },
  { "id": "pebc-054", "nom": "Diabète type 1 et type 2", "categorie": "Endocrine Disorders", "tags": ["diabète", "insuline", "ADO"], "priorite": "critique", "notes": "Algorithmes Diabetes Canada, A1C cibles, iSGLT2 + aGLP1 en cardio/rénoprotection." },
  { "id": "pebc-055", "nom": "Crises hyperglycémiques (ACD, état hyperosmolaire)", "categorie": "Endocrine Disorders", "tags": ["ACD", "urgence", "diabète"], "priorite": "critique", "notes": "Protocole insuline IV, correction K+, hydratation, monitoring bicarb/gap anionique." },
  { "id": "pebc-056", "nom": "Hypothyroïdie et hyperthyroïdie", "categorie": "Endocrine Disorders", "tags": ["thyroïde", "lévothyroxine", "PTU"], "priorite": "important", "notes": "Dosage TSH, interactions (calcium, fer), thyrotoxicose, Graves, méthimazole vs PTU." },
  { "id": "pebc-057", "nom": "Troubles surrénaliens", "categorie": "Endocrine Disorders", "tags": ["surrénales", "cortisol"], "priorite": "secondaire", "notes": "Insuffisance surrénale : hydrocortisone substitutive, crise surrénalienne. Cushing." },
  { "id": "pebc-058", "nom": "Hypogonadisme masculin, santé transgenre", "categorie": "Endocrine Disorders", "tags": ["hypogonadisme", "transgenre"], "priorite": "secondaire", "notes": "Thérapie de remplacement testostérone, hormonothérapie d'affirmation de genre." },
  { "id": "pebc-059", "nom": "Troubles endocriniens médicamenteux", "categorie": "Endocrine Disorders", "tags": ["drug-induced", "endocrine"], "priorite": "important", "notes": "Lithium → hypothyroïdie, corticoïdes → surrénale, antipsychotiques → syndrome métabolique." },
  { "id": "pebc-060", "nom": "Reflux gastro-œsophagien (GERD)", "categorie": "Gastrointestinal Disorders", "tags": ["GERD", "IPP", "GI"], "priorite": "critique", "notes": "IPP (dose, durée, déprescription), anti-H2, mesures non pharmacologiques, alarmes." },
  { "id": "pebc-061", "nom": "Ulcère peptique, H. pylori, hémorragie GI", "categorie": "Gastrointestinal Disorders", "tags": ["ulcère", "H-pylori", "hémorragie-GI"], "priorite": "critique", "notes": "Trithérapie/quadrithérapie H. pylori, prophylaxie de stress en soins critiques." },
  { "id": "pebc-062", "nom": "Maladies inflammatoires de l'intestin (Crohn, CU)", "categorie": "Gastrointestinal Disorders", "tags": ["MII", "Crohn", "CU"], "priorite": "important", "notes": "5-ASA, budésonide, azathioprine/6-MP, anti-TNF, védolizumab, ustékinumab." },
  { "id": "pebc-063", "nom": "Syndrome de l'intestin irritable", "categorie": "Gastrointestinal Disorders", "tags": ["SII", "IBS"], "priorite": "secondaire", "notes": "Approche selon sous-type : IBS-C (linaclotide), IBS-D (lopéramide, rifaximine), fibres." },
  { "id": "pebc-064", "nom": "Cirrhose et complications", "categorie": "Gastrointestinal Disorders", "tags": ["cirrhose", "hépatique"], "priorite": "critique", "notes": "Ascite (spironolactone+furosémide), EH (lactulose+rifaximine), varices (BB non sélectif)." },
  { "id": "pebc-065", "nom": "Constipation, diarrhée, N/V simples et complexes", "categorie": "Gastrointestinal Disorders", "tags": ["GI-mineurs", "N/V", "CINV"], "priorite": "important", "notes": "CINV : ondansétron, dexaméthasone, aprépitant. Laxatifs : PEG, sennosides, bisacodyl." },
  { "id": "pebc-066", "nom": "Pancréatite, maladie cœliaque", "categorie": "Gastrointestinal Disorders", "tags": ["pancréatite", "cœliaque"], "priorite": "secondaire", "notes": "Enzymes pancréatiques (CREON), régime sans gluten, pancréatite médicamenteuse." },
  { "id": "pebc-067", "nom": "Hépatotoxicité médicamenteuse", "categorie": "Gastrointestinal Disorders", "tags": ["drug-induced", "hépatique"], "priorite": "important", "notes": "DILI : acétaminophène, isoniazide, MTX, statines. Monitoring ALT/AST, bilirubine." },
  { "id": "pebc-068", "nom": "Contraception", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["contraception", "femme"], "priorite": "critique", "notes": "COC, progestatifs seuls, DIU (Cu/LNG), implant, anneau, timbre, contraception d'urgence." },
  { "id": "pebc-069", "nom": "Grossesse : nutrition, tératogénicité, dosage, N/V", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["grossesse", "tératogénicité"], "priorite": "critique", "notes": "Acide folique 0.4-5mg, fer, DHA, médicaments CI (isotrétinoïne, warfarine, IECA/ARA, valproate)." },
  { "id": "pebc-070", "nom": "Hypertension gravidique, prééclampsie, éclampsie", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["prééclampsie", "grossesse"], "priorite": "important", "notes": "Labétalol, nifédipine, méthyldopa. MgSO4 en prévention des convulsions. ASA faible dose prévention." },
  { "id": "pebc-071", "nom": "Diabète gestationnel", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["diabète-gestationnel", "grossesse"], "priorite": "important", "notes": "Insuline (1re ligne), metformine (2e ligne), cibles glycémiques plus strictes." },
  { "id": "pebc-072", "nom": "Allaitement et médicaments", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["allaitement", "lactation"], "priorite": "important", "notes": "Compatibilité : LactMed, InfantRisk. Éviter : lithium, certains antiépileptiques, MTX." },
  { "id": "pebc-073", "nom": "Ménopause, endométriose, SOPK, troubles menstruels", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["ménopause", "THR", "SOPK"], "priorite": "important", "notes": "THM (estrogène ± progestatif), risques/bénéfices, COC pour SOPK/endométriose, AINS pour dysménorrhée." },
  { "id": "pebc-074", "nom": "Infertilité, accouchement, interruption de grossesse", "categorie": "Gynecologic & Obstetrical Disorders", "tags": ["infertilité", "obstétrique"], "priorite": "secondaire", "notes": "Clomifène, létrozole, tocolytiques (nifédipine), mifépristone/misoprostol." },
  { "id": "pebc-075", "nom": "Anémies (ferriprive, B12, folate, maladie chronique)", "categorie": "Hematologic Disorders", "tags": ["anémie", "fer", "B12"], "priorite": "important", "notes": "Diagnostic différentiel (VGM, ferritine, B12), supplémentation PO vs IV, ESA en IRC." },
  { "id": "pebc-076", "nom": "Troubles hématologiques médicamenteux", "categorie": "Hematologic Disorders", "tags": ["drug-induced", "hémato"], "priorite": "important", "notes": "Agranulocytose (clozapine, méthimazole), thrombocytopénie (héparine=HIT), anémie aplasique." },
  { "id": "pebc-077", "nom": "Allergies médicamenteuses et anaphylaxie", "categorie": "Immunologic Disorders", "tags": ["allergie", "anaphylaxie", "désensibilisation"], "priorite": "critique", "notes": "Épinéphrine IM 0.3mg (adulte), allergie pénicilline (vrai vs faux), protocoles de désensibilisation." },
  { "id": "pebc-078", "nom": "Transplantation d'organes et immunosuppression", "categorie": "Immunologic Disorders", "tags": ["transplant", "immunosuppresseurs"], "priorite": "important", "notes": "Tacrolimus (niveaux cibles), mycophénolate, basiliximab, prophylaxie CMV/PJP." },
  { "id": "pebc-079", "nom": "LES, immunodéficience", "categorie": "Immunologic Disorders", "tags": ["LES", "auto-immun", "immunodéficience"], "priorite": "secondaire", "notes": "Hydroxychloroquine, corticoïdes, monitoring ophtalmique." },
  { "id": "pebc-080", "nom": "Infections urinaires", "categorie": "Infectious Diseases", "tags": ["IVU", "antibiotiques"], "priorite": "critique", "notes": "Cystite simple : nitrofurantoïne, TMP-SMX, fosfomycine. Pyélonéphrite : fluoroquinolone. Résistances." },
  { "id": "pebc-081", "nom": "IVRS (otite, sinusite, pharyngite)", "categorie": "Infectious Diseases", "tags": ["IVRS", "ORL", "antibiotiques"], "priorite": "critique", "notes": "Amoxicilline 1re ligne OMA/sinusite. Pharyngite : critères Centor, pénicilline V." },
  { "id": "pebc-082", "nom": "Pneumonie communautaire et nosocomiale", "categorie": "Infectious Diseases", "tags": ["pneumonie", "IVRI"], "priorite": "critique", "notes": "CAP ambulatoire vs hospitalisé (CURB-65), macrolides, amox-clav, respiratoire FQ." },
  { "id": "pebc-083", "nom": "Infections peau et tissus mous", "categorie": "Infectious Diseases", "tags": ["IPTM", "cellulite", "dermato"], "priorite": "important", "notes": "Céphalosporine 1re gén (céfazoline), cloxacilline. SARM : TMP-SMX, doxycycline, vancomycine." },
  { "id": "pebc-084", "nom": "VIH", "categorie": "Infectious Diseases", "tags": ["VIH", "ARV"], "priorite": "important", "notes": "Trithérapie (2 INTI + INNTI ou INI), PrEP (TDF/FTC), suivi CV et CD4, interactions." },
];

// ============================================================================
// SUJETS PAR DÉFAUT — suite (085-168)
// ============================================================================
RAW_SUBJECTS.push(
  { "id": "pebc-085", "nom": "Hépatites virales (VHB, VHC)", "categorie": "Infectious Diseases", "tags": ["hépatite", "VHB", "VHC"], "priorite": "important", "notes": "VHC : AAD (sofosbuvir/velpatasvir). VHB : ténofovir, entécavir. Vaccination VHB." },
  { "id": "pebc-086", "nom": "Immunisation : vaccins et calendrier canadien", "categorie": "Infectious Diseases", "tags": ["vaccination", "calendrier-vaccinal"], "priorite": "critique", "notes": "Calendrier provincial, vaccins vivants vs inactivés, CI, intervalles, voyageurs." },
  { "id": "pebc-087", "nom": "Antibiogouvernance (antimicrobial stewardship)", "categorie": "Infectious Diseases", "tags": ["stewardship", "résistance"], "priorite": "important", "notes": "Spectre étroit vs large, de-escalation, durée optimale, indicateurs de qualité." },
  { "id": "pebc-088", "nom": "Infection à Clostridioides difficile", "categorie": "Infectious Diseases", "tags": ["C-diff", "CDI"], "priorite": "important", "notes": "Vancomycine PO (1re ligne), fidaxomicine, transplantation fécale (récurrences multiples)." },
  { "id": "pebc-089", "nom": "Sepsis et choc septique", "categorie": "Infectious Diseases", "tags": ["sepsis", "urgence"], "priorite": "critique", "notes": "Bundles Surviving Sepsis : cultures, antibio large spectre <1h, remplissage, vasopresseurs." },
  { "id": "pebc-090", "nom": "Infections fongiques superficielles et invasives", "categorie": "Infectious Diseases", "tags": ["antifongiques", "mycoses"], "priorite": "important", "notes": "Superficielles : azolés topiques/PO. Invasives : échinocandines, ampho B, voriconazole." },
  { "id": "pebc-091", "nom": "ITS (syphilis, gonorrhée, chlamydia, HPV)", "categorie": "Infectious Diseases", "tags": ["ITS", "santé-sexuelle"], "priorite": "important", "notes": "Ceftriaxone IM (gonorrhée), azithromycine/doxycycline (chlamydia), pénicilline G (syphilis)." },
  { "id": "pebc-092", "nom": "Tuberculose", "categorie": "Infectious Diseases", "tags": ["TB", "tuberculose"], "priorite": "important", "notes": "RIPE (2 mois) puis RI (4 mois), ITBL : isoniazide 9 mois ou rifampicine 4 mois." },
  { "id": "pebc-093", "nom": "Médecine du voyage, parasitoses, prophylaxie chirurgicale", "categorie": "Infectious Diseases", "tags": ["voyage", "malaria", "prophylaxie"], "priorite": "secondaire", "notes": "Malaria : atovaquone-proguanil, méfloquine. Antibioprophylaxie péri-opératoire : céfazoline." },
  { "id": "pebc-094", "nom": "Grippe, méningite, endocardite, infections osseuses", "categorie": "Infectious Diseases", "tags": ["grippe", "méningite", "endocardite"], "priorite": "important", "notes": "Oseltamivir (<48h), ceftriaxone+vancomycine (méningite), durée prolongée endocardite/ostéomyélite." },
  { "id": "pebc-095", "nom": "Neutropénie fébrile, infections chez l'immunodéprimé", "categorie": "Infectious Diseases", "tags": ["neutropénie", "immunodéprimé"], "priorite": "important", "notes": "Pipéracilline-tazobactam ou méropénem empirique. Prophylaxie : fluconazole, TMP-SMX, acyclovir." },
  { "id": "pebc-096", "nom": "Arthrose", "categorie": "Musculoskeletal Disorders", "tags": ["arthrose", "AINS", "MSK"], "priorite": "important", "notes": "Acétaminophène, AINS topiques/PO, duloxétine, injections corticoïdes/viscosupplémentation." },
  { "id": "pebc-097", "nom": "Polyarthrite rhumatoïde", "categorie": "Musculoskeletal Disorders", "tags": ["PAR", "DMARD", "biologiques"], "priorite": "important", "notes": "MTX (1re ligne DMARD), biologiques (anti-TNF, abatacept), JAK inhibiteurs, treat-to-target." },
  { "id": "pebc-098", "nom": "Ostéoporose", "categorie": "Musculoskeletal Disorders", "tags": ["ostéoporose", "bisphosphonates"], "priorite": "important", "notes": "FRAX, DXA, alendronate/risédronate, denosumab, calcium 1000-1200mg + vit D 800-2000 UI/j." },
  { "id": "pebc-099", "nom": "Goutte et hyperuricémie", "categorie": "Musculoskeletal Disorders", "tags": ["goutte", "allopurinol", "colchicine"], "priorite": "important", "notes": "Aigu : AINS/colchicine/corticoïdes. Prophylaxie : allopurinol (cible urate <360), febuxostat." },
  { "id": "pebc-100", "nom": "Blessures tissus mous, rhabdomyolyse", "categorie": "Musculoskeletal Disorders", "tags": ["blessures", "rhabdomyolyse"], "priorite": "secondaire", "notes": "RICE, AINS court terme. Rhabdomyolyse : hydratation agressive IV, monitoring CK et reins." },
  { "id": "pebc-101", "nom": "Épilepsie", "categorie": "Neurologic Disorders", "tags": ["épilepsie", "antiépileptiques"], "priorite": "critique", "notes": "Focale : carbamazépine, lévétiracétam. Généralisée : valproate, lamotrigine. Interactions, tératogénicité." },
  { "id": "pebc-102", "nom": "Céphalées (tension, migraine, cluster)", "categorie": "Neurologic Disorders", "tags": ["migraine", "céphalée"], "priorite": "important", "notes": "Aigu : triptans, AINS. Prophylaxie : propranolol, topiramate, amitriptyline, anti-CGRP (érénumab)." },
  { "id": "pebc-103", "nom": "Maladie de Parkinson", "categorie": "Neurologic Disorders", "tags": ["Parkinson", "lévodopa"], "priorite": "important", "notes": "Lévodopa/carbidopa (gold standard), agonistes DA, IMAO-B, ICOMT. Complications motrices (wearing-off)." },
  { "id": "pebc-104", "nom": "Troubles neurocognitifs (Alzheimer, démence)", "categorie": "Neurologic Disorders", "tags": ["Alzheimer", "démence"], "priorite": "important", "notes": "Donépézil, rivastigmine, galantamine (léger-modéré), mémantine (modéré-sévère), SCPD." },
  { "id": "pebc-105", "nom": "Sclérose en plaques", "categorie": "Neurologic Disorders", "tags": ["SEP", "DMT"], "priorite": "secondaire", "notes": "Poussées : méthylprednisolone IV. DMT : interféron, fingolimod, natalizumab, ocrelizumab." },
  { "id": "pebc-106", "nom": "Douleur nociceptive (aiguë/chronique) et neuropathique", "categorie": "Neurologic Disorders", "tags": ["douleur", "neuropathie", "analgésiques"], "priorite": "critique", "notes": "Échelle OMS, multimodal. Neuropathique : gabapentine, prégabaline, duloxétine, TCA." },
  { "id": "pebc-107", "nom": "Fibromyalgie", "categorie": "Neurologic Disorders", "tags": ["fibromyalgie", "douleur-chronique"], "priorite": "secondaire", "notes": "Duloxétine, prégabaline, amitriptyline faible dose, exercice, approche multidisciplinaire." },
  { "id": "pebc-108", "nom": "Nutriments essentiels, carences et excès vitamines/minéraux", "categorie": "Nutritional Disorders", "tags": ["nutrition", "vitamines", "carences"], "priorite": "important", "notes": "Fer (ferritine, saturation transferrine), B12, folate, vit D (25-OH), calcium, zinc." },
  { "id": "pebc-109", "nom": "Surpoids, obésité, syndromes de malabsorption", "categorie": "Nutritional Disorders", "tags": ["obésité", "malabsorption"], "priorite": "important", "notes": "IMC, sémaglutide/liraglutide, orlistat, chirurgie bariatrique et carences post-op." },
  { "id": "pebc-110", "nom": "Soins de support en oncologie", "categorie": "Oncologic Disorders", "tags": ["onco-support", "CINV", "mucite"], "priorite": "critique", "notes": "Antiémétiques : 5-HT3 + dexa + NK1. G-CSF (filgrastim). Mucite : soins de bouche. Neutropénie fébrile." },
  { "id": "pebc-111", "nom": "Urgences oncologiques", "categorie": "Oncologic Disorders", "tags": ["urgence-onco", "lyse-tumorale"], "priorite": "important", "notes": "SLT : rasburicase, hydratation, allopurinol. Hypercalcémie : hydratation + bisphosphonates + denosumab." },
  { "id": "pebc-112", "nom": "Glaucome", "categorie": "Ophthalmic Disorders", "tags": ["glaucome", "PIO", "ophtalmo"], "priorite": "important", "notes": "Analogues prostaglandines (latanoprost) 1re ligne, BB (timolol), technique d'occlusion nasolacrymale." },
  { "id": "pebc-113", "nom": "Conjonctivite, sécheresse oculaire, DMLA", "categorie": "Ophthalmic Disorders", "tags": ["conjonctivite", "sécheresse-oculaire"], "priorite": "secondaire", "notes": "Larmes artificielles, différencier bactérienne (purulente) vs virale vs allergique. Anti-VEGF pour DMLA humide." },
  { "id": "pebc-114", "nom": "Troubles dépressifs majeurs", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["dépression", "ISRS", "IRSN"], "priorite": "critique", "notes": "ISRS 1re ligne (escitalopram, sertraline), IRSN, bupropion, mirtazapine. Durée min 6-9 mois. Switch/augmentation." },
  { "id": "pebc-115", "nom": "Troubles anxieux (TAG, panique, anxiété sociale)", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["anxiété", "TAG", "benzodiazépines"], "priorite": "critique", "notes": "ISRS/IRSN 1re ligne, BZD court terme seulement, prégabaline, buspirone. TCC recommandée." },
  { "id": "pebc-116", "nom": "Trouble bipolaire", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["bipolaire", "lithium", "stabilisateurs"], "priorite": "important", "notes": "Manie : lithium, valproate, antipsychotiques. Dépression bipolaire : quétiapine, lurasidone. Lithémie 0.6-1.2." },
  { "id": "pebc-117", "nom": "Schizophrénie", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["schizophrénie", "antipsychotiques"], "priorite": "important", "notes": "1re gén (halopéridol) vs 2e gén (rispéridone, olanzapine, quétiapine). Clozapine réfractaire. SEP, syndrome métabolique." },
  { "id": "pebc-118", "nom": "TDAH", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["TDAH", "stimulants"], "priorite": "important", "notes": "Méthylphénidate, amphétamines (1re ligne), atomoxétine, guanfacine. Adultes : mêmes agents, doses ajustées." },
  { "id": "pebc-119", "nom": "Insomnie", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["insomnie", "sommeil"], "priorite": "important", "notes": "Hygiène du sommeil (1re ligne), TCC-I, Z-drugs court terme, suvorexant/lemborexant, trazodone faible dose." },
  { "id": "pebc-120", "nom": "Trouble de l'usage d'alcool", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["alcool", "dépendance"], "priorite": "important", "notes": "Sevrage : BZD (chlordiazépoxide, diazépam). Maintien : naltrexone, acamprosate. Wernicke : thiamine IV." },
  { "id": "pebc-121", "nom": "Trouble de l'usage d'opioïdes", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["TUO", "méthadone", "buprénorphine"], "priorite": "critique", "notes": "TAO : buprénorphine-naloxone (1re ligne), méthadone. Naloxone communautaire. Surdosage : naloxone 0.4mg." },
  { "id": "pebc-122", "nom": "Sevrage tabagique", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["tabac", "cessation", "TRN"], "priorite": "critique", "notes": "TRN (timbre, gomme, pastille, inhalateur), varénicline (1re ligne), bupropion. Rôle clé du pharmacien." },
  { "id": "pebc-123", "nom": "TOC, TSPT, troubles alimentaires, delirium", "categorie": "Psychiatric & Behavioral Disorders", "tags": ["TOC", "TSPT", "delirium"], "priorite": "secondaire", "notes": "ISRS haute dose (TOC), ISRS/IRSN (TSPT), delirium (halopéridol faible dose), TCA et renutrition." },
  { "id": "pebc-124", "nom": "Insuffisance rénale aiguë", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["IRA", "rénal"], "priorite": "critique", "notes": "Classification KDIGO, causes pré-rénales/intrinsèques/post-rénales, néphrotoxiques à éviter." },
  { "id": "pebc-125", "nom": "Insuffisance rénale chronique et complications", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["IRC", "MRC", "anémie-rénale"], "priorite": "critique", "notes": "Stades CKD 1-5, iSGLT2/IECA ralentissent progression, anémie (ASE+fer), troubles minéraux (Ca/PO4/PTH)." },
  { "id": "pebc-126", "nom": "Dialyse et remplacement rénal", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["dialyse", "hémodialyse"], "priorite": "important", "notes": "Ajustement posologique (supplément post-HD), clairance médicamenteuse par dialyse, accès vasculaire." },
  { "id": "pebc-127", "nom": "Troubles électrolytiques (Na, K, Ca, PO4, Mg)", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["électrolytes", "hyperkaliémie"], "priorite": "critique", "notes": "Hyperkaliémie : calcium IV, insuline+glucose, kayexalate, patiromer. Hyponatrémie : restriction hydrique. Très testé." },
  { "id": "pebc-128", "nom": "Troubles acido-basiques", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["acido-basique", "GAB"], "priorite": "important", "notes": "pH, pCO2, HCO3, gap anionique. Acidose métabolique : causes (MUDPILES). Compensation respiratoire/rénale." },
  { "id": "pebc-129", "nom": "Ajustement posologique en insuffisance rénale", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["dose-rénale", "DFG", "clairance"], "priorite": "critique", "notes": "Cockcroft-Gault (pour ajustement), CKD-EPI (pour staging). Médicaments : HBPM, méthotrexate, gabapentine, DOACs." },
  { "id": "pebc-130", "nom": "Néphrotoxicité médicamenteuse, néphrolithiase", "categorie": "Renal, Fluid & Electrolyte Disorders", "tags": ["drug-induced", "néphrotoxicité"], "priorite": "important", "notes": "AINS, aminosides, ampho B, produits de contraste, lithium. Prévention NIC : hydratation." },
  { "id": "pebc-131", "nom": "Asthme", "categorie": "Respiratory Disorders", "tags": ["asthme", "CSI", "BALA"], "priorite": "critique", "notes": "Paliers GINA, CSI 1re ligne contrôle, BACA PRN, technique d'inhalation (MDI vs DPI), plans d'action." },
  { "id": "pebc-132", "nom": "MPOC (COPD)", "categorie": "Respiratory Disorders", "tags": ["MPOC", "COPD", "GOLD"], "priorite": "critique", "notes": "Classification GOLD ABCD, BALA+BAMA, CSI si éosinophiles élevés, exacerbations (prednisone+antibio)." },
  { "id": "pebc-133", "nom": "Fibrose kystique", "categorie": "Respiratory Disorders", "tags": ["FK", "mucoviscidose"], "priorite": "secondaire", "notes": "Modulateurs CFTR (ivacaftor, elexacaftor-tezacaftor), enzymes pancréatiques, antibiothérapie cyclique." },
  { "id": "pebc-134", "nom": "HBP et symptômes du bas appareil urinaire", "categorie": "Urologic Disorders", "tags": ["HBP", "SBAU", "alpha-bloquants"], "priorite": "important", "notes": "Tamsulosine, alfuzosine (alpha-bloquants), dutastéride/finastéride (5-ARI), combinaison si sévère." },
  { "id": "pebc-135", "nom": "Dysfonction érectile, incontinence, cystite interstitielle", "categorie": "Urologic Disorders", "tags": ["DE", "incontinence"], "priorite": "secondaire", "notes": "iPDE5 (sildénafil, tadalafil), anticholinergiques/mirabégron (incontinence d'urgence)." },
  { "id": "pebc-136", "nom": "Processus de soins pharmaceutiques (évaluation, DTP, plan de soins)", "categorie": "Patient Care Process", "tags": ["soins-pharma", "PTP", "évaluation"], "priorite": "critique", "notes": "Framework SOAP/FARM, identification des DTP (8 catégories), objectifs thérapeutiques, suivi." },
  { "id": "pebc-137", "nom": "Éducation du patient sur l'utilisation des médicaments", "categorie": "Patient Care Process", "tags": ["éducation-patient", "observance"], "priorite": "important", "notes": "Teach-back, littératie en santé, observance, adhésion, outils de communication." },
  { "id": "pebc-138", "nom": "Gériatrie : physiologie du vieillissement, polypharmacie, Beers", "categorie": "Special Populations", "tags": ["gériatrie", "polypharmacie", "Beers"], "priorite": "critique", "notes": "Critères de Beers/STOPP-START, déprescription, chutes, fragilité, troubles cognitifs." },
  { "id": "pebc-139", "nom": "Pédiatrie : dosage, conditions courantes, calendrier vaccinal", "categorie": "Special Populations", "tags": ["pédiatrie", "dosage-poids"], "priorite": "critique", "notes": "Dose mg/kg, surface corporelle, infections courantes pédiatriques, déshydratation, fièvre." },
  { "id": "pebc-140", "nom": "Grossesse et allaitement (revue transversale)", "categorie": "Special Populations", "tags": ["grossesse", "allaitement", "populations"], "priorite": "critique", "notes": "Revue croisée avec sujets #69-72. Catégories de risque, LactMed, InfantRisk." },
  { "id": "pebc-141", "nom": "Interprétation des ordonnances, lois et normes de pratique", "categorie": "Prescription Processing & Compounding", "tags": ["ordonnances", "légal", "vérification"], "priorite": "critique", "notes": "Lois fédérales (CDSA, Food and Drugs Act), normes provinciales, ordonnances de substances contrôlées." },
  { "id": "pebc-142", "nom": "Préparations magistrales (compounding)", "categorie": "Prescription Processing & Compounding", "tags": ["compounding", "préparations"], "priorite": "important", "notes": "Calculs de dilution, BUD (beyond-use date), techniques aseptiques, USP <795>/<797>." },
  { "id": "pebc-143", "nom": "Champ élargi : renouvellement, modification, initiation, déprescription", "categorie": "Prescription Processing & Compounding", "tags": ["scope-élargi", "déprescription"], "priorite": "critique", "notes": "Adaptation, substitution thérapeutique, initiation (contraception, voyage), déprescription (IPP, BZD)." },
  { "id": "pebc-144", "nom": "Bilan comparatif des médicaments (MedRec)", "categorie": "Prescription Processing & Compounding", "tags": ["MedRec", "réconciliation"], "priorite": "critique", "notes": "BPMH à l'admission, au transfert, au congé. Divergences intentionnelles vs non intentionnelles." },
  { "id": "pebc-145", "nom": "Administration de vaccins et injections", "categorie": "Prescription Processing & Compounding", "tags": ["injection", "vaccination", "technique"], "priorite": "important", "notes": "Technique IM (deltoïde, vaste latéral), SC, anaphylaxie post-vaccinale, trousse d'urgence." },
  { "id": "pebc-146", "nom": "Calculs : concentration, quantité, dosage", "categorie": "Prescription Calculations", "tags": ["calculs", "concentration", "dosage"], "priorite": "critique", "notes": "mg/mL, %, w/v, w/w, dilutions, conversions d'unités (grain, microgram), doses pédiatriques." },
  { "id": "pebc-147", "nom": "Calculs : débit d'administration et alligations", "categorie": "Prescription Calculations", "tags": ["calculs", "débit", "alligation"], "priorite": "important", "notes": "Perfusions IV (mL/h, gouttes/min), alligation médiale et alternée, osmolarité." },
  { "id": "pebc-148", "nom": "Communication : BPMH, revue de médication, consultation OTC", "categorie": "Communication & Collaborative Care", "tags": ["communication", "BPMH", "OTC"], "priorite": "important", "notes": "Écoute active, empathie, entretien motivationnel, questions ouvertes, teach-back." },
  { "id": "pebc-149", "nom": "Collaboration interprofessionnelle", "categorie": "Communication & Collaborative Care", "tags": ["interpro", "collaboration", "équipe"], "priorite": "important", "notes": "Rôles des professionnels (MD, infirmier, nutritionniste), résolution de conflits, leadership." },
  { "id": "pebc-150", "nom": "Communication culturellement respectueuse, décision partagée", "categorie": "Communication & Collaborative Care", "tags": ["culturel", "décision-partagée"], "priorite": "important", "notes": "Humilité culturelle, interprètes, prise de décision partagée, consentement éclairé." },
  { "id": "pebc-151", "nom": "Stratégies de santé et bien-être", "categorie": "Health Promotion & Disease Prevention", "tags": ["prévention", "promotion-santé"], "priorite": "important", "notes": "Counseling mode de vie, activité physique, alimentation saine, réduction des méfaits." },
  { "id": "pebc-152", "nom": "Services préventifs : vaccination, cessation tabagique, dépistage", "categorie": "Health Promotion & Disease Prevention", "tags": ["dépistage", "vaccination", "prévention"], "priorite": "critique", "notes": "Programmes canadiens : dépistage cancer (col, sein, colorectal), diabète, HTA. Vaccination adulte." },
  { "id": "pebc-153", "nom": "Évaluation critique de la littérature et EBM", "categorie": "Literature Evaluation & Research Methods", "tags": ["critical-appraisal", "EBM", "études"], "priorite": "critique", "notes": "Types d'études (RCT, cohorte, cas-témoin), biais, NNT/NNH, validité interne/externe." },
  { "id": "pebc-154", "nom": "Biostatistiques appliquées", "categorie": "Literature Evaluation & Research Methods", "tags": ["biostatistiques", "p-value", "IC"], "priorite": "important", "notes": "Puissance, IC 95%, valeur p, risque relatif vs absolu, OR, test t, chi-carré, ANOVA." },
  { "id": "pebc-155", "nom": "Pharmacoéconomie et économie de la santé", "categorie": "Literature Evaluation & Research Methods", "tags": ["pharmacoéconomie", "coût-efficacité"], "priorite": "important", "notes": "ACE, ACU (QALY), ACB, ICER, perspective (société vs payeur), plans d'assurance médicaments." },
  { "id": "pebc-156", "nom": "Système de distribution sécuritaire des médicaments", "categorie": "Medication & Patient Safety", "tags": ["sécurité", "distribution"], "priorite": "important", "notes": "Circuit du médicament, double vérification, robots, codes-barres, ISMP alertes." },
  { "id": "pebc-157", "nom": "Prévention des erreurs et déclaration des EI", "categorie": "Medication & Patient Safety", "tags": ["erreurs", "ADR", "pharmacovigilance"], "priorite": "critique", "notes": "Causes d'erreurs (LASA, abréviations), RCA, Canada Vigilance (déclaration EI), culture juste." },
  { "id": "pebc-158", "nom": "Cadres éthiques et normes professionnelles", "categorie": "Professionalism & Ethics", "tags": ["éthique", "normes", "déontologie"], "priorite": "critique", "notes": "Autonomie, bienfaisance, non-malfaisance, justice. Consentement éclairé, confidentialité, LPRPDE." },
  { "id": "pebc-159", "nom": "Valeurs canadiennes et dilemmes éthiques en pharmacie", "categorie": "Professionalism & Ethics", "tags": ["éthique", "dilemmes", "canada"], "priorite": "important", "notes": "Refus de traitement (conscience), conflits d'intérêts, double loyauté patient/employeur." },
  { "id": "pebc-160", "nom": "Compétence culturelle et professionnalisme", "categorie": "Professionalism & Ethics", "tags": ["compétence-culturelle", "diversité"], "priorite": "important", "notes": "Patients aux besoins uniques, humilité culturelle, biais inconscients, communication inclusive." },
  { "id": "pebc-161", "nom": "Gestion financière, RH, opérations, inventaire", "categorie": "Pharmacy Management", "tags": ["gestion", "finances", "RH"], "priorite": "important", "notes": "Marge brute/nette, rotation des stocks, gestion du personnel, planification stratégique." },
  { "id": "pebc-162", "nom": "Développement et évaluation de services pharmaceutiques", "categorie": "Pharmacy Management", "tags": ["services", "qualité", "QI"], "priorite": "important", "notes": "PDCA, indicateurs de performance, amélioration continue, programmes de soins pharma." },
  { "id": "pebc-163", "nom": "Leadership, gestion du changement, technologies", "categorie": "Pharmacy Management", "tags": ["leadership", "TI", "changement"], "priorite": "secondaire", "notes": "Gestion du changement (Kotter), dossiers pharmaceutiques, télépharmacie, IA en pharmacie." },
  { "id": "pebc-164", "nom": "Système de santé canadien : structure, financement, histoire", "categorie": "Canadian Healthcare System & Health Equity", "tags": ["système-santé", "canada", "LCS"], "priorite": "critique", "notes": "Loi canadienne sur la santé (5 principes), rôles fédéral/provincial, régimes publics d'assurance." },
  { "id": "pebc-165", "nom": "Champ de pratique de l'équipe de pharmacie", "categorie": "Canadian Healthcare System & Health Equity", "tags": ["scope", "équipe-pharma", "rôles"], "priorite": "important", "notes": "Pharmacien vs technicien vs étudiant, rôles des autres professionnels, milieux de pratique." },
  { "id": "pebc-166", "nom": "Déterminants sociaux de la santé et équité en santé", "categorie": "Canadian Healthcare System & Health Equity", "tags": ["DSS", "équité", "déterminants-sociaux"], "priorite": "critique", "notes": "Revenu, logement, éducation, emploi, racisme systémique. Impact sur l'accès aux soins (nouveau 2025)." },
  { "id": "pebc-167", "nom": "Santé autochtone et sécurité culturelle", "categorie": "Canadian Healthcare System & Health Equity", "tags": ["autochtone", "sécurité-culturelle", "réconciliation"], "priorite": "critique", "notes": "Premières Nations, Inuits, Métis. Appels à l'action CVR, Joyce's Principle, guérison traditionnelle (nouveau 2025)." },
  { "id": "pebc-168", "nom": "Diversité culturelle et soins inclusifs", "categorie": "Canadian Healthcare System & Health Equity", "tags": ["diversité", "inclusion", "LGBTQ+"], "priorite": "important", "notes": "Orientation sexuelle, identité de genre, handicap, compétence linguistique (nouveau 2025)." }
);

// Normalise les sujets bruts en ajoutant champs calculés
const PEBC_DEFAULT_SUBJECTS = RAW_SUBJECTS.map(s => ({
  ...s,
  semainePlan: SEMAINE_PLAN[s.id] || 0,
  statut: "pas_commence",
  confiance: 1,
  ressources: s.ressources || [],
  dateCreation: "2026-04-16T00:00:00.000Z",
  dateDerniereRevision: null,
  dateProchaineRevision: null,
  historiqueRevisions: [],
  priorite_onboarding: null,
}));

const PEBC_CATEGORIES = [
  "Biotechnology & Pharmacogenetics", "Canadian Healthcare System & Health Equity", "Cardiovascular Disorders",
  "Clinical Biochemistry & Lab Testing", "Communication & Collaborative Care", "Dermatologic Disorders",
  "ENT Disorders", "Endocrine Disorders", "Gastrointestinal Disorders", "Gynecologic & Obstetrical Disorders",
  "Health Promotion & Disease Prevention", "Hematologic Disorders", "Immunologic Disorders", "Infectious Diseases",
  "Literature Evaluation & Research Methods", "Medication & Patient Safety", "Musculoskeletal Disorders",
  "Neurologic Disorders", "Nutritional Disorders", "Oncologic Disorders", "Ophthalmic Disorders",
  "Pathophysiology", "Patient Care Process", "Pharmaceutics & Drug Delivery", "Pharmacokinetics & Biopharmaceutics",
  "Pharmacology", "Pharmacy Management", "Prescription Calculations", "Prescription Processing & Compounding",
  "Professionalism & Ethics", "Psychiatric & Behavioral Disorders", "Renal, Fluid & Electrolyte Disorders",
  "Respiratory Disorders", "Special Populations", "Toxicology", "Urologic Disorders"
];

const PEBC_MILESTONES = [
  { "id": "j-01", "label": "Terminer Sciences pharmaceutiques (25%)", "date": "", "atteint": false },
  { "id": "j-02", "label": "Terminer Pratique pharmaceutique (55%)", "date": "", "atteint": false },
  { "id": "j-03", "label": "Terminer Sciences comportementales (20%)", "date": "", "atteint": false },
  { "id": "j-04", "label": "Révision complète — 1er passage", "date": "", "atteint": false },
  { "id": "j-05", "label": "Examen blanc #1", "date": "", "atteint": false },
  { "id": "j-06", "label": "Examen blanc #2", "date": "", "atteint": false },
  { "id": "j-07", "label": "Révision finale (sujets faibles)", "date": "", "atteint": false },
];

const DOMAIN_MAP = {
  "Pharmaceutical Sciences": {
    weight: 25, color: "#8B5CF6", label: "Sciences pharmaceutiques",
    categories: ["Pharmaceutics & Drug Delivery", "Pharmacokinetics & Biopharmaceutics", "Pharmacology", "Toxicology", "Biotechnology & Pharmacogenetics"]
  },
  "Pharmacy Practice": {
    weight: 55, color: "#2563EB", label: "Pratique pharmaceutique",
    categories: ["Pathophysiology", "Clinical Biochemistry & Lab Testing", "Cardiovascular Disorders", "Dermatologic Disorders", "ENT Disorders", "Endocrine Disorders", "Gastrointestinal Disorders", "Gynecologic & Obstetrical Disorders", "Hematologic Disorders", "Immunologic Disorders", "Infectious Diseases", "Musculoskeletal Disorders", "Neurologic Disorders", "Nutritional Disorders", "Oncologic Disorders", "Ophthalmic Disorders", "Psychiatric & Behavioral Disorders", "Renal, Fluid & Electrolyte Disorders", "Respiratory Disorders", "Urologic Disorders", "Patient Care Process", "Special Populations", "Prescription Processing & Compounding", "Prescription Calculations", "Communication & Collaborative Care"]
  },
  "BSA Sciences": {
    weight: 20, color: "#059669", label: "Sciences comportementales, sociales et admin.",
    categories: ["Health Promotion & Disease Prevention", "Literature Evaluation & Research Methods", "Medication & Patient Safety", "Professionalism & Ethics", "Pharmacy Management", "Canadian Healthcare System & Health Equity"]
  }
};

// ============================================================================
// CONSTANTES UI
// ============================================================================
const CI = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
const CC = { 1: "#DC2626", 2: "#F97316", 3: "#EAB308", 4: "#22C55E", 5: "#059669" };

const PC = {
  critique: { c: "#DC2626", bg: "bg-red-100 dark:bg-red-900/30", t: "text-red-700 dark:text-red-400", l: "Critique" },
  important: { c: "#D97706", bg: "bg-amber-100 dark:bg-amber-900/30", t: "text-amber-700 dark:text-amber-400", l: "Important" },
  secondaire: { c: "#6B7280", bg: "bg-gray-100 dark:bg-gray-700/30", t: "text-gray-600 dark:text-gray-400", l: "Secondaire" }
};

const SC = {
  pas_commence: { l: "Pas commencé", c: "#6B7280", bg: "bg-gray-100 dark:bg-gray-700", t: "text-gray-700 dark:text-gray-300", i: Circle },
  en_cours: { l: "En cours", c: "#2563EB", bg: "bg-blue-100 dark:bg-blue-900/30", t: "text-blue-700 dark:text-blue-400", i: Clock },
  maitrise: { l: "Maîtrisé", c: "#059669", bg: "bg-emerald-100 dark:bg-emerald-900/30", t: "text-emerald-700 dark:text-emerald-400", i: CheckCircle2 }
};

const NAV = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "plan", label: "Plan 26 semaines", icon: Map },
  { id: "subjects", label: "Sujets", icon: List },
  { id: "flashcards", label: "Flashcards", icon: Brain },
  { id: "planning", label: "Planning", icon: CalendarDays },
  { id: "sessions", label: "Sessions", icon: Play },
  { id: "stats", label: "Statistiques", icon: BarChart3 },
  { id: "insights", label: "Insights", icon: TrendingUp },
  { id: "settings", label: "Paramètres", icon: Settings }
];


// ============================================================================
// UTILITAIRES
// ============================================================================
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID)
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2) + Date.now().toString(36);
const td = () => new Date().toISOString().split("T")[0];
const db = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const fd = i => { if (!i) return "—"; return new Date(i).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); };
const fsd = i => { if (!i) return "—"; return new Date(i).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
const ad = (i, d) => { const x = new Date(i); x.setDate(x.getDate() + d); return x.toISOString(); };

const isOv = s => {
  if (!s.dateProchaineRevision) return false;
  if (s.statut === "maitrise" && s.confiance === 5) return false;
  return new Date(s.dateProchaineRevision) < new Date(new Date().toDateString());
};
const isDT = s => { if (!s.dateProchaineRevision) return false; return s.dateProchaineRevision.split("T")[0] === td(); };
const cnr = c => ad(new Date().toISOString(), CI[c] || 7);

const cpt = (s, nc) => { let p = isOv(s) ? 15 : 10; if (nc > s.confiance) p += (nc - s.confiance) * 5; return p; };

const gd = cat => {
  for (const [k, d] of Object.entries(DOMAIN_MAP)) {
    if (d.categories.includes(cat)) return { key: k, ...d };
  }
  return { key: "PP", ...DOMAIN_MAP["Pharmacy Practice"] };
};

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
    return { ...s, _s: score };
  });
  return _.orderBy(sc, "_s", "desc").slice(0, n);
};

const calcRetention = (s) => {
  if (!s.historiqueRevisions || s.historiqueRevisions.length < 2) return null;
  const h = s.historiqueRevisions;
  const last = h[h.length - 1], prev = h[h.length - 2];
  const retainedRatio = prev.confianceApres > 0 ? last.confianceAvant / prev.confianceApres : 1;
  const confNorm = s.confiance / 5;
  const revFactor = Math.min(h.length / 5, 1);
  const oubli = prev.confianceApres > 0 ? Math.max(0, (prev.confianceApres - last.confianceAvant) / prev.confianceApres) : 0;
  return Math.round((retainedRatio * 40 + confNorm * 30 + revFactor * 20 + (1 - oubli) * 10));
};

const isFragile = (s) => {
  if (!s.historiqueRevisions || s.historiqueRevisions.length < 2) return false;
  const h = s.historiqueRevisions;
  const last = h[h.length - 1];
  if (last.confianceApres < last.confianceAvant) return true;
  if (h.length >= 3) {
    const a = h[h.length - 3].confianceApres, b = h[h.length - 2].confianceApres, c = last.confianceApres;
    if (a < b && b > c) return true;
  }
  const ret = calcRetention(s);
  return ret !== null && ret < 50;
};

const isSurapprentissage = (s) => {
  if (s.confiance < 5 || s.statut !== "maitrise") return false;
  const now = new Date();
  const recent = (s.historiqueRevisions || []).filter(r => {
    const d = new Date(r.date);
    return (now - d) / 864e5 < 14;
  });
  return recent.length >= 3;
};

const calcExamReadiness = (sujets) => {
  // Garde-fou : si aucune révision n'a été enregistrée, le score est 0.
  // Évite le score artificiel ~18% lié à la confiance initiale (1/5) et à
  // la rétention par défaut (0.5) quand l'utilisateur n'a encore rien fait.
  const hasAnyRevision = sujets.some(s => s.dateDerniereRevision || (s.historiqueRevisions && s.historiqueRevisions.length > 0));
  if (!hasAnyRevision) return 0;
  let total = 0, wTotal = 0;
  Object.entries(DOMAIN_MAP).forEach(([k, d]) => {
    const ds = sujets.filter(s => d.categories.includes(s.categorie));
    if (!ds.length) return;
    const t = ds.length;
    const pctM = ds.filter(s => s.statut === "maitrise").length / t;
    const confN = _.meanBy(ds, "confiance") / 5;
    const rets = ds.map(s => calcRetention(s)).filter(r => r !== null);
    const retN = rets.length > 0 ? _.mean(rets) / 100 : 0.5;
    const covN = ds.filter(s => s.dateDerniereRevision).length / t;
    const score = pctM * 0.35 + confN * 0.25 + retN * 0.25 + covN * 0.15;
    total += score * (d.weight / 100);
    wTotal += d.weight / 100;
  });
  return wTotal > 0 ? Math.round(total / wTotal * 100) : 0;
};

const getForceScore = (sujets, cat) => {
  const ds = sujets.filter(s => s.categorie === cat);
  if (!ds.length) return 0;
  const confN = _.meanBy(ds, "confiance") / 5 * 40;
  const pctM = ds.filter(s => s.statut === "maitrise").length / ds.length * 30;
  const rets = ds.map(s => calcRetention(s)).filter(r => r !== null);
  const retN = rets.length > 0 ? _.mean(rets) / 100 * 30 : 15;
  return Math.round(confN + pctM + retN);
};

// ============================================================================
// PLAN 26 SEMAINES — utilitaires dédiés
// ============================================================================
/**
 * Calcule la date de la Semaine 1 du plan (26 semaines avant la date d'examen).
 * Retourne null si dateExamen absente.
 */
const getPlanStartDate = (dateExamen) => {
  if (!dateExamen) return null;
  return ad(new Date(dateExamen).toISOString(), -26 * 7).split("T")[0];
};

/**
 * Retourne le numéro de semaine du plan (1-26) pour une date donnée.
 * Retourne 0 si avant la S1, 27+ si après S26, null si dateExamen absente.
 */
const getPlanWeek = (dateStr, dateExamen) => {
  if (!dateExamen) return null;
  const start = getPlanStartDate(dateExamen);
  if (!start) return null;
  const diffDays = db(start, dateStr);
  if (diffDays < 0) return 0;
  return Math.floor(diffDays / 7) + 1;
};

/** Retourne la date de début (ISO date string YYYY-MM-DD) d'une semaine du plan */
const getWeekStartDate = (weekNum, dateExamen) => {
  if (!dateExamen) return null;
  const start = getPlanStartDate(dateExamen);
  if (!start) return null;
  return ad(new Date(start).toISOString(), (weekNum - 1) * 7).split("T")[0];
};

/** Retourne la phase correspondant à une semaine */
const getPhaseForWeek = (weekNum) => {
  return PHASES_PLAN.find(p => p.semaines.includes(weekNum)) || null;
};

/** Calcule le % de complétion d'une liste de sujets (maîtrisés / total) */
const calcCompletionPct = (sujets) => {
  if (!sujets.length) return 0;
  return Math.round(sujets.filter(s => s.statut === "maitrise").length / sujets.length * 100);
};

/** Détermine la trajectoire (vert/jaune/rouge) pour une phase selon complétion attendue vs réelle */
const getTrajectoire = (phase, sujets, currentWeek) => {
  const phaseSujets = sujets.filter(s => phase.semaines.includes(s.semainePlan));
  if (!phaseSujets.length) return { color: "gray", label: "—", pct: 0 };
  const pct = calcCompletionPct(phaseSujets);
  // Semaine courante DANS la phase, ou complétée ?
  const maxWeek = Math.max(...phase.semaines);
  const minWeek = Math.min(...phase.semaines);
  if (currentWeek < minWeek) return { color: "gray", label: "À venir", pct };
  if (currentWeek > maxWeek) {
    if (pct >= 80) return { color: "green", label: "Terminée", pct };
    if (pct >= 50) return { color: "yellow", label: "Partiellement terminée", pct };
    return { color: "red", label: "Phase incomplète", pct };
  }
  // Phase en cours : complétion attendue = progrès dans la phase
  const weeksElapsed = currentWeek - minWeek + 1;
  const expectedPct = (weeksElapsed / phase.semaines.length) * 100;
  if (pct >= expectedPct * 0.9) return { color: "green", label: "Dans les temps", pct };
  if (pct >= expectedPct * 0.6) return { color: "yellow", label: "Léger retard", pct };
  return { color: "red", label: "Retard important", pct };
};


// ============================================================================
// STATE INITIAL + REDUCER
// ============================================================================
const DS = {
  loaded: false,
  view: "dashboard",
  theme: "clair",
  sujets: [],
  settings: {
    dateExamen: null,
    jalons: PEBC_MILESTONES,
    categoriesDisponibles: PEBC_CATEGORIES,
    alerteFatigueMin: 45,
    alerteFatigueSujets: 8,
    objectifsActifs: true,
    objectifs: {
      quotidien: { nbSujets: 10, dureeMinutes: 60, points: 100 },
      hebdomadaire: { nbSujets: 50, dureeMinutes: 300, sessionsMin: 5 }
    },
    checkpointsLog: {}, // { "s4": { date, reponses: {q1: true, ...}, trajectoire: "green", notes } }
    // Onboarding "Solide / Bon / Faible / Inconnu" — calibre priorite_onboarding sur les sujets.
    onboarding: {
      statut: "non_commence",          // "non_commence" | "en_cours" | "termine"
      etape: "categories",              // "categories" | "affinage" | "termine"
      indexCategorieActuelle: 0,        // 0 à 35 (36 catégories PEBC)
      niveauxCategorie: {},              // { "Cardiovascular Disorders": "solide", ... }
      categoriesAFiner: [],              // catégories marquées "bon" ou "faible" à affiner
      indexCategorieAffinage: 0,
      indexSujetAffinage: 0,
      dateDebut: null,
      dateFin: null,
      welcomeDismissed: false,           // true après clic "Plus tard" sur la modale d'accueil
      completionAcknowledged: false      // true après clic "Aller au tableau de bord" sur la modale de fin
    }
  },
  motivation: { streakActuel: 0, streakMax: 0, pointsTotal: 0, historiqueJournalier: [], sessionsLog: [] },
  toasts: [],
  dB: [],
  session: null,
  svm: "table",
  insightsTab: "readiness",
  sessionEval: null,
  undoStack: [],
  trash: []
};

function R(state, action) {
  const { type: T, payload: P } = action;
  switch (T) {
    case "LOAD_DATA": {
      const { sujets: s, settings: se, motivation: m } = P;
      // Migration : ajoute priorite_onboarding aux sujets existants qui ne l'ont pas encore.
      // Le ?? préserve les valeurs déjà saisies si l'utilisateur a déjà commencé un onboarding.
      const sujetsCharges = s && s.length > 0
        ? s.map(sj => ({ ...sj, priorite_onboarding: sj.priorite_onboarding ?? null }))
        : PEBC_DEFAULT_SUBJECTS;
      return {
        ...state,
        loaded: true,
        sujets: sujetsCharges,
        settings: {
          ...DS.settings,
          ...se,
          checkpointsLog: se?.checkpointsLog || {},
          // Migration : merge avec le shape par défaut pour garantir tous les champs même sur saves anciens.
          onboarding: { ...DS.settings.onboarding, ...(se?.onboarding || {}) }
        },
        motivation: { ...DS.motivation, ...m }
      };
    }
    case "SET_VIEW": return { ...state, view: P };
    case "SET_THEME": return { ...state, theme: P };
    case "SET_SVM": return { ...state, svm: P };
    case "ADD_S": return { ...state, sujets: [...state.sujets, P] };
    case "UPD_S": return { ...state, sujets: state.sujets.map(s => s.id === P.id ? { ...s, ...P } : s) };
    case "DEL_S": return { ...state, sujets: state.sujets.filter(s => s.id !== P) };
    case "REC_REV": {
      const { sujetId: si, newConfiance: nc, dureeMinutes: dm } = P;
      const now = new Date().toISOString(), tds = td();
      const su = state.sujets.find(s => s.id === si);
      if (!su) return state;
      const pts = cpt(su, nc);
      const ns = state.sujets.map(s => {
        if (s.id !== si) return s;
        return {
          ...s,
          confiance: nc,
          statut: nc >= 4 ? "maitrise" : nc >= 2 ? "en_cours" : s.statut === "pas_commence" ? "en_cours" : s.statut,
          dateDerniereRevision: now,
          dateProchaineRevision: cnr(nc),
          historiqueRevisions: [...(s.historiqueRevisions || []), { date: now, confianceAvant: s.confiance, confianceApres: nc, dureeMinutes: dm || null }]
        };
      });
      const mt = { ...state.motivation };
      const le = mt.historiqueJournalier[mt.historiqueJournalier.length - 1];
      if (le && le.date === tds) {
        le.nbRevisions += 1;
        le.pointsGagnes += pts;
      } else {
        const y = ad(now, -1).split("T")[0];
        mt.streakActuel = (le && le.date === y) || mt.historiqueJournalier.length === 0 ? mt.streakActuel + 1 : 1;
        mt.historiqueJournalier = [...mt.historiqueJournalier, { date: tds, nbRevisions: 1, pointsGagnes: pts }];
      }
      mt.streakMax = Math.max(mt.streakMax, mt.streakActuel);
      mt.pointsTotal += pts;
      if (mt.streakActuel === 7) mt.pointsTotal += 30;
      if (mt.streakActuel === 30) mt.pointsTotal += 100;
      return { ...state, sujets: ns, motivation: mt };
    }
    case "UPD_SET": return { ...state, settings: { ...state.settings, ...P } };
    case "ADD_ML": return { ...state, settings: { ...state.settings, jalons: [...state.settings.jalons, P] } };
    case "TOG_ML": return { ...state, settings: { ...state.settings, jalons: state.settings.jalons.map(j => j.id === P ? { ...j, atteint: !j.atteint } : j) } };
    case "DEL_ML": return { ...state, settings: { ...state.settings, jalons: state.settings.jalons.filter(j => j.id !== P) } };
    case "SAVE_CHECKPOINT": {
      // P = { id: "s4", reponses: {...}, trajectoire: "green", notes: "..." }
      const log = { ...state.settings.checkpointsLog, [P.id]: { date: new Date().toISOString(), ...P } };
      return { ...state, settings: { ...state.settings, checkpointsLog: log } };
    }
    case "START_S": return { ...state, session: P, view: "sessions" };
    case "S_NEXT": {
      if (!state.session) return state;
      return { ...state, session: { ...state.session, currentIndex: state.session.currentIndex + 1, results: [...state.session.results, P] } };
    }
    case "END_S": return { ...state, session: null };
    case "TOG_P": {
      if (!state.session) return state;
      const se = state.session;
      return se.paused
        ? { ...state, session: { ...se, paused: false, startTime: Date.now() - se.pausedElapsed } }
        : { ...state, session: { ...se, paused: true, pausedElapsed: Date.now() - se.startTime } };
    }
    case "IMP": return { ...state, ...P };
    case "RESET": return { ...DS, loaded: true, theme: state.theme };
    case "TOAST": return { ...state, toasts: [...state.toasts, { id: uid(), ...P }] };
    case "RM_TOAST": return { ...state, toasts: state.toasts.filter(t => t.id !== P) };
    case "DIS_B": return { ...state, dB: [...state.dB, P] };
    case "SET_ITAB": return { ...state, insightsTab: P };
    case "PUSH_UNDO": {
      const stack = [...state.undoStack, { state: { sujets: state.sujets, motivation: state.motivation, settings: state.settings }, ts: Date.now(), label: P }].slice(-10);
      return { ...state, undoStack: stack };
    }
    case "UNDO": {
      if (!state.undoStack.length) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      const now = Date.now();
      if (now - prev.ts > 30000) return { ...state, undoStack: state.undoStack.slice(0, -1) };
      return { ...state, sujets: prev.state.sujets, motivation: prev.state.motivation, settings: prev.state.settings, undoStack: state.undoStack.slice(0, -1) };
    }
    case "TRASH_S": {
      const s = state.sujets.find(x => x.id === P);
      if (!s) return state;
      return { ...state, sujets: state.sujets.filter(x => x.id !== P), trash: [...state.trash, { ...s, deletedAt: new Date().toISOString() }] };
    }
    case "RESTORE_S": {
      const s = state.trash.find(x => x.id === P);
      if (!s) return state;
      const { deletedAt, ...clean } = s;
      return { ...state, trash: state.trash.filter(x => x.id !== P), sujets: [...state.sujets, clean] };
    }
    case "EMPTY_TRASH": return { ...state, trash: [] };
    case "CLEAN_TRASH": {
      const cutoff = Date.now() - 7 * 864e5;
      return { ...state, trash: state.trash.filter(s => new Date(s.deletedAt).getTime() > cutoff) };
    }
    case "LOG_SESSION": {
      const mt = { ...state.motivation };
      mt.sessionsLog = [...(mt.sessionsLog || []), P];
      return { ...state, motivation: mt };
    }
    case "SET_EVAL": return { ...state, sessionEval: P };
    case "CLEAR_EVAL": return { ...state, sessionEval: null };
    case "ONBOARDING_START": {
      return {
        ...state,
        settings: {
          ...state.settings,
          onboarding: {
            ...state.settings.onboarding,
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
    case "ONBOARDING_DISMISS_WELCOME": {
      return {
        ...state,
        settings: {
          ...state.settings,
          onboarding: { ...state.settings.onboarding, welcomeDismissed: true }
        }
      };
    }
    case "ONBOARDING_SET_CATEGORY_LEVEL": {
      const { categorie, niveau } = P;
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
      const ob = state.settings.onboarding;
      const aFinerExist = ob.categoriesAFiner.length > 0;
      return {
        ...state,
        settings: {
          ...state.settings,
          onboarding: {
            ...ob,
            etape: aFinerExist ? "affinage" : "termine",
            statut: aFinerExist ? "en_cours" : "termine",
            indexCategorieAffinage: 0,
            indexSujetAffinage: 0,
            dateFin: aFinerExist ? null : new Date().toISOString()
          }
        }
      };
    }
    case "ONBOARDING_SET_SUBJECT_LEVEL": {
      const { sujetId, niveau } = P;
      return {
        ...state,
        sujets: state.sujets.map(s =>
          s.id === sujetId ? { ...s, priorite_onboarding: niveau } : s
        )
      };
    }
    case "ONBOARDING_NEXT_REFINING": {
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
    case "ONBOARDING_PREV_REFINING": {
      // Symétrique au ONBOARDING_GO_BACK_CATEGORY de l'étape 1.
      // No-op si on est au tout premier sujet de la première catégorie à affiner.
      const ob = state.settings.onboarding;
      let { indexCategorieAffinage, indexSujetAffinage } = ob;
      if (indexSujetAffinage > 0) {
        indexSujetAffinage--;
      } else if (indexCategorieAffinage > 0) {
        indexCategorieAffinage--;
        const catPrev = ob.categoriesAFiner[indexCategorieAffinage];
        const sujetsPrev = state.sujets.filter(s => s.categorie === catPrev);
        indexSujetAffinage = Math.max(0, sujetsPrev.length - 1);
      } else {
        return state;
      }
      return {
        ...state,
        settings: {
          ...state.settings,
          onboarding: { ...ob, indexCategorieAffinage, indexSujetAffinage }
        }
      };
    }
    case "ONBOARDING_PAUSE": return state;
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
    case "ONBOARDING_ACK_COMPLETION": {
      return {
        ...state,
        settings: {
          ...state.settings,
          onboarding: { ...state.settings.onboarding, completionAcknowledged: true }
        }
      };
    }
    case "RESET_ONBOARDING": {
      return {
        ...state,
        sujets: state.sujets.map(s => ({ ...s, priorite_onboarding: null })),
        settings: {
          ...state.settings,
          onboarding: { ...DS.settings.onboarding }
        }
      };
    }
    default: return state;
  }
}

// ============================================================================
// PERSISTENCE (window.storage avec fallback)
// ============================================================================
const storage = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) return await window.storage.get(key);
      const v = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      return v ? { value: v } : null;
    } catch { return null; }
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) return await window.storage.set(key, value);
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch {}
  },
  async delete(key) {
    try {
      if (typeof window !== "undefined" && window.storage) return await window.storage.delete(key);
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch {}
  }
};

const sv = _.debounce(async st => {
  try {
    await Promise.all([
      storage.set("sujets", JSON.stringify(st.sujets)),
      storage.set("settings", JSON.stringify(st.settings)),
      storage.set("motivation", JSON.stringify(st.motivation)),
      storage.set("trash", JSON.stringify(st.trash || []))
    ]);
  } catch (e) { console.error(e); }
}, 500);


// ============================================================================
// COMPOSANTS UI DE BASE
// ============================================================================
function CS({ value: v, onChange: oc, size: sz = 18 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => oc?.(i)} className={oc ? "cursor-pointer hover:scale-110" : "cursor-default"}>
          <Star size={sz} fill={i <= v ? CC[v] : "none"} stroke={i <= v ? CC[v] : "currentColor"} className={i <= v ? "" : "text-gray-300 dark:text-gray-600"} />
        </button>
      ))}
    </div>
  );
}

function Bg({ children: ch, className: cn = "" }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cn}`}>{ch}</span>;
}

function SB({ statut: s }) {
  const c = SC[s], I = c.i;
  return <Bg className={`${c.bg} ${c.t}`}><I size={12} className="mr-1" />{c.l}</Bg>;
}

function PI({ priorite: p }) {
  const c = PC[p];
  return <Bg className={`${c.bg} ${c.t}`}>{c.l}</Bg>;
}

function KPI({ icon: I, label: l, value: v, sub: s, color: c = "text-blue-600 dark:text-blue-400" }) {
  return (
    <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-gray-50 dark:bg-[#252830] ${c}`}><I size={20} /></div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{l}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{v}</div>
      {s && <div className="text-xs text-gray-400 mt-1">{s}</div>}
    </div>
  );
}

function Md({ open: o, onClose: oc, title: t, children: ch, wide: w }) {
  if (!o) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={oc}>
      <div className={`bg-white dark:bg-[#1A1D27] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2A2D37] w-full ${w ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto animate-in`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2A2D37]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t}</h2>
          <button onClick={oc} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-5">{ch}</div>
      </div>
    </div>
  );
}

function Tst({ toast: t, onD, onUndo }) {
  useEffect(() => {
    const x = setTimeout(() => onD(t.id), t.undoable ? 5000 : 3000);
    return () => clearTimeout(x);
  }, [t.id, onD, t.undoable]);
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-emerald-600 text-white text-sm font-medium animate-in">
      <Check size={16} />
      <span className="flex-1">{t.message}</span>
      {t.undoable && (
        <button onClick={() => { onUndo(); onD(t.id); }} className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold flex items-center gap-1">
          <Undo2 size={12} />Annuler
        </button>
      )}
    </div>
  );
}

function TC({ toasts: ts, dispatch: d }) {
  const dm = useCallback(id => d({ type: "RM_TOAST", payload: id }), [d]);
  const undo = useCallback(() => d({ type: "UNDO" }), [d]);
  if (!ts.length) return null;
  return <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">{ts.map(t => <Tst key={t.id} toast={t} onD={dm} onUndo={undo} />)}</div>;
}

function PB({ value: v, max: m, color: c = "bg-blue-500", className: cn = "" }) {
  const p = m > 0 ? Math.round(v / m * 100) : 0;
  return (
    <div className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 ${cn}`}>
      <div className={`h-full rounded-full ${c} transition-all duration-500`} style={{ width: `${p}%` }} />
    </div>
  );
}

function ES({ icon: I, message: m, action: a }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#252830] mb-4"><I size={40} className="text-gray-300 dark:text-gray-600" /></div>
      <p className="text-gray-400 mb-4 max-w-xs">{m}</p>
      {a}
    </div>
  );
}

function CM({ open: o, onClose: oc, onConfirm: of2, title: t, message: m, confirmLabel: cl = "Supprimer", danger: dg = true }) {
  if (!o) return null;
  return (
    <Md open={o} onClose={oc} title={t}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{m}</p>
      <div className="flex justify-end gap-3">
        <button onClick={oc} className="px-4 py-2 text-sm text-gray-600 rounded-lg">Annuler</button>
        <button onClick={of2} className={`px-4 py-2 text-sm text-white rounded-lg font-medium ${dg ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>{cl}</button>
      </div>
    </Md>
  );
}


// ============================================================================
// ONBOARDING — composants
// ============================================================================
// Modale de bienvenue affichée au tout premier démarrage (statut "non_commence",
// welcomeDismissed false, aucune révision encore enregistrée). Le montage
// effectif et la condition d'affichage sont gérés dans App() au commit 7.
function OnboardingWelcomeModal({ open, dispatch }) {
  if (!open) return null;
  const dismiss = () => dispatch({ type: "ONBOARDING_DISMISS_WELCOME" });
  const start = () => dispatch({ type: "ONBOARDING_START" });
  return (
    <Md open={open} onClose={dismiss} title="Bienvenue dans RevTracker">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <p>Avant de commencer, prenons 10-15 minutes pour calibrer ta préparation.</p>
        <p>
          Tu vas évaluer ton niveau <strong>catégorie par catégorie</strong> sur les 36 catégories
          du blueprint PEBC, puis affiner certaines zones sujet par sujet.
        </p>
        <p className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
          <strong>Important :</strong> ta confiance reste à 1/5 partout — l'onboarding sert
          uniquement à <strong>prioriser</strong> les sujets dans tes futures révisions.
          Tu confirmeras ton vrai niveau au fil des révisions.
        </p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={dismiss} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          Plus tard
        </button>
        <button onClick={start} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
          Commencer
        </button>
      </div>
    </Md>
  );
}

// Étape 1 de l'onboarding : auto-évaluation par catégorie (1/36 → 36/36).
// Standalone — sera orchestrée par OnboardingModal au commit 6.
function OnboardingCategoryStep({ state, dispatch, onPause }) {
  const ob = state.settings.onboarding;
  const categories = state.settings.categoriesDisponibles;
  const idx = ob.indexCategorieActuelle;
  const total = categories.length;
  const categorie = categories[idx];
  if (!categorie) return null;
  const sujetsCount = state.sujets.filter(s => s.categorie === categorie).length;
  const domaine = gd(categorie);
  const niveauActuel = ob.niveauxCategorie[categorie];
  const choisir = (niveau) => dispatch({ type: "ONBOARDING_SET_CATEGORY_LEVEL", payload: { categorie, niveau } });
  const retour = () => dispatch({ type: "ONBOARDING_GO_BACK_CATEGORY" });
  const niveaux = [
    { key: "solide",  label: "Solide",  bg: "bg-emerald-600 hover:bg-emerald-700", ring: "ring-emerald-600", desc: "Je connais bien, je pourrais traiter une question d'examen sans révision lourde." },
    { key: "bon",     label: "Bon",     bg: "bg-blue-600 hover:bg-blue-700",       ring: "ring-blue-600",    desc: "J'ai des bases solides, mais quelques zones à rafraîchir." },
    { key: "faible",  label: "Faible",  bg: "bg-orange-600 hover:bg-orange-700",   ring: "ring-orange-600",  desc: "J'ai des notions, mais beaucoup à revoir." },
    { key: "inconnu", label: "Inconnu", bg: "bg-red-600 hover:bg-red-700",         ring: "ring-red-600",     desc: "Je ne maîtrise pas, ou jamais étudié sérieusement." }
  ];
  return (
    <Md open={true} onClose={onPause} title={`Onboarding — Catégorie ${idx + 1}/${total}`} wide>
      <div className="space-y-5">
        <PB value={idx + 1} max={total} color="bg-blue-500" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{categorie}</h3>
          <p className="text-sm text-gray-500 mt-1">{sujetsCount} sujet{sujetsCount > 1 ? "s" : ""} dans cette catégorie</p>
          <p className="text-xs text-gray-500 mt-1">
            Domaine : <span style={{ color: domaine.color }} className="font-medium">{domaine.label}</span> ({domaine.weight}%)
          </p>
        </div>
        <p className="font-medium text-gray-700 dark:text-gray-300">Quel est ton niveau global sur cette zone ?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {niveaux.map(n => (
            <button
              key={n.key}
              onClick={() => choisir(n.key)}
              className={`text-left p-3 rounded-lg text-white font-medium transition ${n.bg} ${niveauActuel === n.key ? `ring-2 ring-offset-2 dark:ring-offset-[#1A1D27] ${n.ring}` : ""}`}
            >
              <div className="font-semibold">{n.label}</div>
              <div className="text-xs font-normal mt-1 opacity-90">{n.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-[#2A2D37]">
          <button
            onClick={retour}
            disabled={idx === 0}
            className={`px-3 py-2 text-sm rounded-lg flex items-center gap-1 ${idx === 0 ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            ← Retour
          </button>
          <button onClick={onPause} className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Pause
          </button>
        </div>
      </div>
    </Md>
  );
}

// Modale de transition entre l'étape 1 (catégories) et l'étape 2 (affinage).
// X / backdrop = "Terminer" (skip affinage) — décision produit validée.
function OnboardingTransitionModal({ state, dispatch }) {
  const ob = state.settings.onboarding;
  const nbAFiner = ob.categoriesAFiner.length;
  const affiner = () => dispatch({ type: "ONBOARDING_START_REFINING" });
  const terminer = () => dispatch({ type: "ONBOARDING_COMPLETE" });
  return (
    <Md open={true} onClose={terminer} title="Catégories de base évaluées ✓">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Tu as marqué <strong>{nbAFiner}</strong> catégorie{nbAFiner > 1 ? "s" : ""} en "Bon" ou "Faible".
        </p>
        <p>Veux-tu les affiner sujet par sujet ? Cela rendra ton planning plus précis.</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={terminer} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          Terminer
        </button>
        <button onClick={affiner} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
          Affiner maintenant
        </button>
      </div>
    </Md>
  );
}

// Étape 2 de l'onboarding : affinage sujet-par-sujet des catégories partielles.
// X / backdrop = Pause (par symétrie avec le bouton Pause).
function OnboardingRefineStep({ state, dispatch, onPause }) {
  const ob = state.settings.onboarding;
  const cat = ob.categoriesAFiner[ob.indexCategorieAffinage];
  if (!cat) return null;
  const sujetsCat = state.sujets.filter(s => s.categorie === cat);
  const sujet = sujetsCat[ob.indexSujetAffinage];
  if (!sujet) return null;
  const nbCat = ob.categoriesAFiner.length;
  const choisir = (niveau) => {
    dispatch({ type: "ONBOARDING_SET_SUBJECT_LEVEL", payload: { sujetId: sujet.id, niveau } });
    dispatch({ type: "ONBOARDING_NEXT_REFINING" });
  };
  const garder = () => dispatch({ type: "ONBOARDING_NEXT_REFINING" });
  const retour = () => dispatch({ type: "ONBOARDING_PREV_REFINING" });
  const retourDisabled = ob.indexSujetAffinage === 0 && ob.indexCategorieAffinage === 0;
  const niveauActuel = sujet.priorite_onboarding;
  const niveaux = [
    { key: "solide",  label: "Solide",  bg: "bg-emerald-600 hover:bg-emerald-700", ring: "ring-emerald-600", desc: "Je connais bien, je pourrais traiter une question d'examen sans révision lourde." },
    { key: "bon",     label: "Bon",     bg: "bg-blue-600 hover:bg-blue-700",       ring: "ring-blue-600",    desc: "J'ai des bases solides, mais quelques zones à rafraîchir." },
    { key: "faible",  label: "Faible",  bg: "bg-orange-600 hover:bg-orange-700",   ring: "ring-orange-600",  desc: "J'ai des notions, mais beaucoup à revoir." },
    { key: "inconnu", label: "Inconnu", bg: "bg-red-600 hover:bg-red-700",         ring: "ring-red-600",     desc: "Je ne maîtrise pas, ou jamais étudié sérieusement." }
  ];
  return (
    <Md open={true} onClose={onPause} title={`Affinage — ${cat} (${ob.indexCategorieAffinage + 1}/${nbCat})`} wide>
      <div className="space-y-5">
        <PB value={ob.indexSujetAffinage + 1} max={sujetsCat.length} color="bg-blue-500" />
        <p className="text-xs text-gray-500">Sujet {ob.indexSujetAffinage + 1}/{sujetsCat.length}</p>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{sujet.nom}</h3>
          {sujet.notes && (
            <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-[#252830] text-sm text-gray-600 dark:text-gray-400">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes du sujet :</p>
              <p className="whitespace-pre-line">{sujet.notes}</p>
            </div>
          )}
        </div>
        <p className="font-medium text-gray-700 dark:text-gray-300">Ton niveau ?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {niveaux.map(n => (
            <button
              key={n.key}
              onClick={() => choisir(n.key)}
              className={`text-left p-3 rounded-lg text-white font-medium transition ${n.bg} ${niveauActuel === n.key ? `ring-2 ring-offset-2 dark:ring-offset-[#1A1D27] ${n.ring}` : ""}`}
            >
              <div className="font-semibold">{n.label}</div>
              <div className="text-xs font-normal mt-1 opacity-90">{n.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#2A2D37]">
          <button
            onClick={retour}
            disabled={retourDisabled}
            className={`px-3 py-2 text-sm rounded-lg ${retourDisabled ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          >
            ← Retour
          </button>
          <button onClick={garder} className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Garder niveau catégorie
          </button>
          <button onClick={onPause} className="ml-auto px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Pause
          </button>
        </div>
      </div>
    </Md>
  );
}

// Modale de félicitations affichée à la fin de l'onboarding.
// Le bouton "Aller au tableau de bord" dispatch ONBOARDING_ACK_COMPLETION,
// qui marque la modale comme acquittée pour ne plus jamais la réafficher.
function OnboardingCompleteStep({ state, dispatch }) {
  const ob = state.settings.onboarding;
  const ack = () => dispatch({ type: "ONBOARDING_ACK_COMPLETION" });
  // Durée approximative de l'onboarding (minutes), si dateDebut et dateFin existent.
  const dureeMin = (ob.dateDebut && ob.dateFin)
    ? Math.max(1, Math.round((new Date(ob.dateFin) - new Date(ob.dateDebut)) / 60000))
    : null;
  const nbSujets = state.sujets.length;
  return (
    <Md open={true} onClose={ack} title="Onboarding terminé ✓">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Tu as évalué tes <strong>{nbSujets}</strong> sujets
          {dureeMin !== null ? <> en <strong>{dureeMin} min</strong></> : null}.
          Tes priorités sont calibrées.
        </p>
        <p className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
          <strong>Rappel :</strong> ta confiance reste à 1/5 partout. Au fil de tes vraies révisions,
          l'app affinera tes scores.
        </p>
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={ack} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
          Aller au tableau de bord
        </button>
      </div>
    </Md>
  );
}

// Orchestrateur stateless de l'onboarding : sélectionne le sous-composant à afficher
// en fonction de settings.onboarding (statut + étape + indices).
// La gestion de l'état "paused" (pour fermer/rouvrir la modale) est faite dans App()
// au commit 7 — ici on ne décide que "quel écran montrer si on doit en montrer un".
function OnboardingModal({ state, dispatch, onPause }) {
  const ob = state.settings.onboarding;
  const total = state.settings.categoriesDisponibles.length;

  // Étape 1 : auto-évaluation par catégorie.
  if (ob.statut === "en_cours" && ob.etape === "categories") {
    if (ob.indexCategorieActuelle >= total) {
      return <OnboardingTransitionModal state={state} dispatch={dispatch} />;
    }
    return <OnboardingCategoryStep state={state} dispatch={dispatch} onPause={onPause} />;
  }

  // Étape 2 : affinage sujet-par-sujet.
  if (ob.statut === "en_cours" && ob.etape === "affinage") {
    return <OnboardingRefineStep state={state} dispatch={dispatch} onPause={onPause} />;
  }

  // Modale de fin (une seule fois, jusqu'à RESET_ONBOARDING).
  if (ob.statut === "termine" && !ob.completionAcknowledged) {
    return <OnboardingCompleteStep state={state} dispatch={dispatch} />;
  }

  return null;
}

// Bannière de reprise affichée sur le dashboard tant que l'onboarding n'est pas terminé.
// Trois cas, dans cet ordre :
//   - statut "non_commence" + welcomeDismissed → bouton "Démarrer" (l'utilisateur a cliqué Plus tard)
//   - statut "en_cours" → bouton "Reprendre" avec progression (catégorie X/36 ou affinage X/Y)
//   - sinon (statut "termine" ou modale de bienvenue active) → null
function OnboardingResumeBanner({ state, dispatch, onResume }) {
  const ob = state.settings.onboarding;
  const total = state.settings.categoriesDisponibles.length;

  if (ob.statut === "non_commence" && ob.welcomeDismissed) {
    const demarrer = () => {
      dispatch({ type: "ONBOARDING_START" });
      onResume();
    };
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 flex items-center gap-3">
        <span className="text-sm text-blue-800 dark:text-blue-200 flex-1">
          Onboarding non commencé — calibre tes priorités en 10-15 min.
        </span>
        <button onClick={demarrer} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
          Démarrer
        </button>
      </div>
    );
  }

  if (ob.statut === "en_cours") {
    const progressLabel = ob.etape === "categories"
      ? `Catégorie ${Math.min(ob.indexCategorieActuelle + 1, total)}/${total}`
      : `Affinage ${ob.indexCategorieAffinage + 1}/${ob.categoriesAFiner.length}`;
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-center gap-3">
        <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          Onboarding en cours — {progressLabel}.
        </span>
        <button onClick={onResume} className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">
          Reprendre
        </button>
      </div>
    );
  }

  return null;
}


// ============================================================================
// DASHBOARD HELPERS
// ============================================================================
function DWB({ sujets: sj }) {
  const dd = useMemo(() => Object.entries(DOMAIN_MAP).map(([k, d]) => {
    const ds = sj.filter(s => d.categories.includes(s.categorie));
    const t = ds.length, m = ds.filter(s => s.statut === "maitrise").length;
    const cm = t > 0 ? _.meanBy(ds, "confiance") : 0, p = t > 0 ? Math.round(m / t * 100) : 0;
    const rc = ds.filter(s => s.dateDerniereRevision).length, cp = t > 0 ? Math.round(rc / t * 100) : 0;
    return { k, ...d, t, m, p, cm: cm.toFixed(1), cp, ur: cp < 30 };
  }), [sj]);
  return (
    <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37] space-y-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pondération PEBC (25% / 55% / 20%)</h3>
      {dd.map(d => (
        <div key={d.k}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.label}</span>
              <span className="text-xs text-gray-400">({d.weight}%)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: d.color }}>{d.p}%</span>
              {d.ur && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"><AlertTriangle size={10} />Sous-révisé</span>}
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.p}%`, backgroundColor: d.color }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>{d.m}/{d.t} maîtrisés</span>
            <span>Conf. {d.cm}/5</span>
            <span>Couverture {d.cp}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DRC({ sujets: sj }) {
  const dd = useMemo(() => Object.entries(DOMAIN_MAP).map(([k, d]) => {
    const ds = sj.filter(s => d.categories.includes(s.categorie));
    const t = ds.length;
    return {
      domain: d.label.slice(0, 18),
      maitrise: t > 0 ? Math.round(ds.filter(s => s.statut === "maitrise").length / t * 100) : 0,
      confiance: t > 0 ? Math.round(_.meanBy(ds, "confiance") * 20) : 0,
      couverture: t > 0 ? Math.round(ds.filter(s => s.dateDerniereRevision).length / t * 100) : 0
    };
  }), [sj]);
  return (
    <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Radar par domaine</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={dd}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
          <Radar name="Maîtrise %" dataKey="maitrise" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
          <Radar name="Confiance" dataKey="confiance" stroke="#059669" fill="#059669" fillOpacity={0.1} />
          <Radar name="Couverture" dataKey="couverture" stroke="#D97706" fill="#D97706" fillOpacity={0.1} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SKC({ motivation: mt }) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = ad(new Date().toISOString(), -i).split("T")[0];
    days.push({ d, a: !!mt.historiqueJournalier.find(e => e.date === d) });
  }
  return (
    <div>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">30 derniers jours</div>
      <div className="grid grid-cols-10 gap-1">
        {days.map(x => <div key={x.d} title={x.d} className={`w-full aspect-square rounded-sm ${x.a ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-700"}`} />)}
      </div>
    </div>
  );
}

function NB({ state: st, dispatch: dp }) {
  const bn = [];
  const oc = st.sujets.filter(isOv).length;
  if (oc > 0 && !st.dB.includes("ov")) bn.push({ id: "ov", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", t: "text-red-700 dark:text-red-400", m: `${oc} sujet(s) en retard`, lk: "planning" });
  if (st.settings.dateExamen) {
    const dl = db(td(), st.settings.dateExamen);
    if (dl >= 0 && dl <= 7 && !st.dB.includes("ex")) bn.push({ id: "ex", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", t: "text-amber-700 dark:text-amber-400", m: `Examen dans ${dl} jour(s)` });
  }
  // Banner checkpoint dû
  if (st.settings.dateExamen) {
    const curWeek = getPlanWeek(td(), st.settings.dateExamen);
    CHECKPOINTS_DEF.forEach(cp => {
      const done = !!st.settings.checkpointsLog?.[cp.id];
      if (!done && curWeek >= cp.semaine && curWeek <= cp.semaine + 1 && !st.dB.includes(`cp-${cp.id}`)) {
        bn.push({ id: `cp-${cp.id}`, bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800", t: "text-purple-700 dark:text-purple-400", m: `${cp.titre} à remplir`, lk: "plan" });
      }
    });
  }
  Object.entries(DOMAIN_MAP).forEach(([k, d]) => {
    const ds = st.sujets.filter(s => d.categories.includes(s.categorie));
    const rv = ds.filter(s => s.dateDerniereRevision).length;
    if (ds.length > 0 && (rv / ds.length) < 0.15 && !st.dB.includes(`d-${k}`))
      bn.push({ id: `d-${k}`, bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800", t: "text-purple-700 dark:text-purple-400", m: `${d.label} (${d.weight}%) : sous-révisé` });
  });
  if (!bn.length) return null;
  return (
    <div className="flex flex-col gap-2 mb-4">
      {bn.map(b => (
        <div key={b.id} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${b.bg} ${b.t} text-sm`}>
          <span>{b.m}{b.lk && <button onClick={() => dp({ type: "SET_VIEW", payload: b.lk })} className="underline ml-2 font-medium">Voir</button>}</span>
          <button onClick={() => dp({ type: "DIS_B", payload: b.id })} className="ml-3 hover:opacity-70"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function RM({ open: o, onClose: oc, subject: su, dispatch: dp }) {
  const [cf, sCf] = useState(su?.confiance || 1);
  useEffect(() => { if (su) sCf(su.confiance); }, [su]);
  if (!su) return null;
  return (
    <Md open={o} onClose={oc} title="Réviser">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{su.nom}</h3>
          <p className="text-sm text-gray-500">{su.categorie} • <span style={{ color: gd(su.categorie).color }}>{gd(su.categorie).label}</span></p>
        </div>
        {su.notes && <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252830] text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{su.notes}</div>}
        {su.ressources?.length > 0 && (
          <div className="space-y-1">
            {su.ressources.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"><ExternalLink size={14} />{r.label || r.url}</a>)}
          </div>
        )}
        <div className="pt-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Confiance ?</label>
          <CS value={cf} onChange={sCf} size={28} />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#2A2D37]">
          <button onClick={oc} className="px-4 py-2 text-sm text-gray-600 rounded-lg">Annuler</button>
          <button onClick={() => {
            dp({ type: "PUSH_UNDO", payload: "Révision de " + su.nom });
            dp({ type: "REC_REV", payload: { sujetId: su.id, newConfiance: cf } });
            dp({ type: "TOAST", payload: { message: `Révisé ✓ (+${cpt(su, cf)} pts)` } });
            oc();
          }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Valider</button>
        </div>
      </div>
    </Md>
  );
}


function ExamReadinessGauge({ sujets }) {
  const score = useMemo(() => calcExamReadiness(sujets), [sujets]);
  const color = score < 40 ? "#DC2626" : score < 60 ? "#F97316" : score < 75 ? "#EAB308" : "#059669";
  const domainScores = useMemo(() => Object.entries(DOMAIN_MAP).map(([k, d]) => {
    const ds = sujets.filter(s => d.categories.includes(s.categorie));
    const t = ds.length;
    if (!t) return { ...d, k, score: 0 };
    const pctM = ds.filter(s => s.statut === "maitrise").length / t;
    const confN = _.meanBy(ds, "confiance") / 5;
    return { ...d, k, score: Math.round((pctM * 50 + confN * 50)) };
  }), [sujets]);
  return (
    <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37] text-center">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Score de préparation</h3>
      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${score * 3.27} 327`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-black" style={{ color }}>{score}%</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {domainScores.map(d => (
          <div key={d.k} className="text-center">
            <div className="text-xs text-gray-400">{d.label.slice(0, 12)}</div>
            <div className="text-sm font-bold" style={{ color: d.color }}>{d.score}%</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 italic">Indicateur personnel basé sur votre auto-évaluation. Ne prédit pas le résultat.</p>
    </div>
  );
}

function ObjectiveRings({ state }) {
  const obj = state.settings.objectifs;
  if (!obj || !state.settings.objectifsActifs) return null;
  const todayStr = td();
  const todayRevs = state.sujets.reduce((s, x) => s + (x.historiqueRevisions || []).filter(r => r.date.split("T")[0] === todayStr).length, 0);
  const todayPts = state.motivation.historiqueJournalier.find(e => e.date === todayStr)?.pointsGagnes || 0;
  const todaySessions = (state.motivation.sessionsLog || []).filter(s => s.date.split("T")[0] === todayStr);
  const todayMin = todaySessions.reduce((s, x) => s + (x.dureeMinutes || 0), 0);
  const ring = (val, max, color, label) => {
    const pct = max > 0 ? Math.min(val / max, 1) * 100 : 0;
    return (
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto">
          <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#E5E7EB" strokeWidth="5" />
            <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${pct * 1.508} 151`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{val}</div>
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{label}</div>
        <div className="text-[10px] text-gray-500">/{max}</div>
      </div>
    );
  };
  return (
    <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Objectifs du jour</h3>
      <div className="flex justify-around">
        {ring(todayRevs, obj.quotidien.nbSujets || 10, "#2563EB", "Sujets")}
        {ring(todayMin, obj.quotidien.dureeMinutes || 60, "#059669", "Minutes")}
        {ring(todayPts, obj.quotidien.points || 100, "#D97706", "Points")}
      </div>
    </div>
  );
}

function DV({ state: st, dispatch: dp }) {
  const total = st.sujets.length;
  const maitrise = st.sujets.filter(s => s.statut === "maitrise").length;
  const pM = total > 0 ? Math.round(maitrise / total * 100) : 0;
  const due = st.sujets.filter(s => isDT(s) || isOv(s));
  const cM = total > 0 ? (_.sumBy(st.sujets, "confiance") / total).toFixed(1) : "—";
  const exD = st.settings.dateExamen ? db(td(), st.settings.dateExamen) : null;
  const sr = useMemo(() => gsr(st.sujets, 6), [st.sujets]);
  const [rs, sRs] = useState(null);
  const cd = useMemo(() => {
    const d = [];
    for (let i = 29; i >= 0; i--) {
      const dt = ad(new Date().toISOString(), -i).split("T")[0];
      const mc = st.sujets.filter(s => {
        if (s.statut !== "maitrise") return false;
        const f = s.historiqueRevisions?.find(r => r.confianceApres >= 4);
        return f && f.date.split("T")[0] <= dt;
      }).length;
      d.push({ date: new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), pct: total > 0 ? Math.round(mc / total * 100) : 0 });
    }
    return d;
  }, [st.sujets]);

  if (total === 0) return <ES icon={BookOpen} message="Aucun sujet." action={<button onClick={() => dp({ type: "SET_VIEW", payload: "subjects" })} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Plus size={16} />Ajouter</button>} />;

  return (
    <div className="space-y-6">
      {exD !== null && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold">PEBC Evaluating Examination</h3>
              <p className="text-blue-100 text-sm mt-1">140 QCM • 2×70 questions • 90 min/section</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black">J-{Math.max(0, exD)}</div>
              <div className="text-blue-200 text-sm">{fd(st.settings.dateExamen)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold">{pM}%</div><div className="text-xs text-blue-200">Maîtrisé</div></div>
            <div className="bg-white/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold">{due.length}</div><div className="text-xs text-blue-200">À réviser</div></div>
            <div className="bg-white/10 rounded-lg p-3 text-center"><div className="text-2xl font-bold">{cM}</div><div className="text-xs text-blue-200">Confiance /5</div></div>
          </div>
        </div>
      )}
      {exD === null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={Target} label="Progression" value={`${pM}%`} sub={`${maitrise}/${total}`} color="text-emerald-600 dark:text-emerald-400" />
          <KPI icon={CalendarDays} label="À réviser" value={due.length} color="text-blue-600" />
          <KPI icon={Star} label="Confiance" value={`${cM}/5`} color="text-amber-600" />
          <KPI icon={Flame} label="Streak" value={`${st.motivation.streakActuel}j`} color="text-orange-600" />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ExamReadinessGauge sujets={st.sujets} />
        <ObjectiveRings state={st} />
        <DWB sujets={st.sujets} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DRC sujets={st.sujets} />
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-500" />Sujets fragiles</h3>
          {st.sujets.filter(isFragile).length === 0 ? <p className="text-sm text-gray-400">Aucun sujet fragile 🎉</p> : (
            <div className="space-y-1">
              {st.sujets.filter(isFragile).slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{s.nom}</span>
                  <CS value={s.confiance} size={12} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Progression</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={cd}>
              <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip />
              <Area type="monotone" dataKey="pct" stroke="#2563EB" fill="url(#bg)" strokeWidth={2} name="Maîtrise %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Streak</h3>
            <div className="flex items-center gap-1 text-orange-500"><Flame size={18} /><span className="font-bold">{st.motivation.streakActuel}</span></div>
          </div>
          <SKC motivation={st.motivation} />
          <p className="text-xs text-gray-400 mt-2">Record : {st.motivation.streakMax}j • {st.motivation.pointsTotal} pts</p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <div className="flex items-center gap-2 mb-4"><Zap size={18} className="text-amber-500" /><h3 className="text-sm font-medium text-gray-500">Recommandations du jour</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sr.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-[#252830]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isOv(s) && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{s.nom}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{s.categorie}</span>
                  <CS value={s.confiance} size={10} />
                </div>
              </div>
              <button onClick={() => sRs(s)} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded font-medium ml-2 shrink-0">Réviser</button>
            </div>
          ))}
        </div>
      </div>
      <RM open={!!rs} onClose={() => sRs(null)} subject={rs} dispatch={dp} />
    </div>
  );
}


function SFM({ open: o, onClose: oc, subject: su, state: st, dispatch: dp }) {
  const ie = !!su;
  const [fm, sFm] = useState({ nom: "", categorie: st.settings.categoriesDisponibles[0] || "", tags: [], priorite: "secondaire", statut: "pas_commence", confiance: 1, notes: "", ressources: [], semainePlan: 0 });
  const [er, sEr] = useState({});
  useEffect(() => {
    if (su) sFm({ nom: su.nom, categorie: su.categorie, tags: su.tags || [], priorite: su.priorite, statut: su.statut, confiance: su.confiance, notes: su.notes || "", ressources: su.ressources || [], semainePlan: su.semainePlan || 0 });
    else sFm({ nom: "", categorie: st.settings.categoriesDisponibles[0] || "", tags: [], priorite: "secondaire", statut: "pas_commence", confiance: 1, notes: "", ressources: [], semainePlan: 0 });
    sEr({});
  }, [su, o]);
  const ic = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const hs = () => {
    if (!fm.nom.trim()) { sEr({ nom: "Requis" }); return; }
    if (ie) {
      dp({ type: "UPD_S", payload: { id: su.id, ...fm } });
      dp({ type: "TOAST", payload: { message: "Modifié ✓" } });
    } else {
      dp({ type: "ADD_S", payload: { id: uid(), ...fm, dateCreation: new Date().toISOString(), dateDerniereRevision: null, dateProchaineRevision: null, historiqueRevisions: [] } });
      dp({ type: "TOAST", payload: { message: "Ajouté ✓" } });
    }
    oc();
  };
  return (
    <Md open={o} onClose={oc} title={ie ? "Modifier" : "Ajouter"} wide>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Nom *</label>
          <input className={`${ic} ${er.nom ? "border-red-500" : ""}`} value={fm.nom} onChange={e => sFm(f => ({ ...f, nom: e.target.value.slice(0, 100) }))} />
          {er.nom && <p className="text-xs text-red-500 mt-1">{er.nom}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Catégorie</label>
            <select className={ic} value={fm.categorie} onChange={e => sFm(f => ({ ...f, categorie: e.target.value }))}>
              {st.settings.categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Priorité</label>
            <div className="flex gap-1">
              {Object.entries(PC).map(([k, v]) => (
                <button key={k} type="button" onClick={() => sFm(f => ({ ...f, priorite: k }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${fm.priorite === k ? `${v.bg} ${v.t} ring-2` : "bg-gray-50 dark:bg-gray-700 text-gray-500"}`}>{v.l}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Confiance</label>
            <CS value={fm.confiance} onChange={v => sFm(f => ({ ...f, confiance: v }))} size={24} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Semaine du plan (0 = non planifié)</label>
            <input type="number" min={0} max={26} className={ic} value={fm.semainePlan} onChange={e => sFm(f => ({ ...f, semainePlan: Math.max(0, Math.min(26, +e.target.value || 0)) }))} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes</label>
          <textarea className={`${ic} h-24 resize-none`} value={fm.notes} onChange={e => sFm(f => ({ ...f, notes: e.target.value.slice(0, 2000) }))} />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#2A2D37]">
          <button onClick={oc} className="px-4 py-2 text-sm text-gray-600 rounded-lg">Annuler</button>
          <button onClick={hs} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Enregistrer</button>
        </div>
      </div>
    </Md>
  );
}

function SV({ state: st, dispatch: dp }) {
  const [se, sSe] = useState("");
  const [sf, sSf] = useState(false);
  const [fl, sFl] = useState({ cat: [], sta: [], pri: [], ov: false, week: null });
  const [fo, sFo] = useState(false);
  const [es, sEs] = useState(null);
  const [rs, sRs] = useState(null);
  const [dt, sDt] = useState(null);
  const [sk, sSk] = useState("nom");
  const [sd, sSd] = useState("asc");
  const vm = st.svm;

  const fd2 = useMemo(() => {
    let l = st.sujets;
    if (se.trim()) {
      const q = se.toLowerCase();
      l = l.filter(s => s.nom.toLowerCase().includes(q) || (s.notes || "").toLowerCase().includes(q));
    }
    if (fl.cat.length) l = l.filter(s => fl.cat.includes(s.categorie));
    if (fl.sta.length) l = l.filter(s => fl.sta.includes(s.statut));
    if (fl.pri.length) l = l.filter(s => fl.pri.includes(s.priorite));
    if (fl.ov) l = l.filter(isOv);
    if (fl.week !== null) l = l.filter(s => s.semainePlan === fl.week);
    return _.orderBy(l, [sk], [sd]);
  }, [st.sujets, se, fl, sk, sd]);

  const ts = k => { if (sk === k) sSd(d => d === "asc" ? "desc" : "asc"); else { sSk(k); sSd("asc"); } };
  const SI = sd === "asc" ? ChevronUp : ChevronDown;

  const kg = useMemo(() => ({
    pas_commence: fd2.filter(s => s.statut === "pas_commence"),
    en_cours: fd2.filter(s => s.statut === "en_cours"),
    maitrise: fd2.filter(s => s.statut === "maitrise")
  }), [fd2]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rechercher…" value={se} onChange={e => sSe(e.target.value)} />
        </div>
        <button onClick={() => sSf(f => !f)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border ${sf ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 dark:border-gray-600 text-gray-600"}`}><Filter size={16} />Filtres</button>
        <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <button onClick={() => dp({ type: "SET_SVM", payload: "table" })} className={`px-3 py-2 text-sm ${vm === "table" ? "bg-blue-600 text-white" : "text-gray-500"}`}><List size={16} /></button>
          <button onClick={() => dp({ type: "SET_SVM", payload: "kanban" })} className={`px-3 py-2 text-sm ${vm === "kanban" ? "bg-blue-600 text-white" : "text-gray-500"}`}><Columns3 size={16} /></button>
        </div>
        <span className="text-sm text-gray-400">{fd2.length} sujets</span>
        <button onClick={() => { sEs(null); sFo(true); }} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium"><Plus size={16} />Ajouter</button>
      </div>
      {sf && (
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-4 border border-gray-100 dark:border-[#2A2D37] grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie</label>
            <select className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-xs" value="" onChange={e => { if (e.target.value && !fl.cat.includes(e.target.value)) sFl(f => ({ ...f, cat: [...f.cat, e.target.value] })); }}>
              <option value="">Toutes</option>
              {st.settings.categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex flex-wrap gap-1 mt-1">
              {fl.cat.map(c => <Bg key={c} className="bg-blue-50 text-blue-700 text-[10px]">{c.slice(0, 15)}<button onClick={() => sFl(f => ({ ...f, cat: f.cat.filter(x => x !== c) }))}><X size={10} /></button></Bg>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Statut</label>
            {Object.entries(SC).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-xs">
                <input type="checkbox" checked={fl.sta.includes(k)} onChange={e => sFl(f => ({ ...f, sta: e.target.checked ? [...f.sta, k] : f.sta.filter(x => x !== k) }))} />
                {v.l}
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Priorité</label>
            {Object.entries(PC).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-xs">
                <input type="checkbox" checked={fl.pri.includes(k)} onChange={e => sFl(f => ({ ...f, pri: e.target.checked ? [...f.pri, k] : f.pri.filter(x => x !== k) }))} />
                {v.l}
              </label>
            ))}
            <label className="flex items-center gap-2 mt-2 text-xs"><input type="checkbox" checked={fl.ov} onChange={e => sFl(f => ({ ...f, ov: e.target.checked }))} />En retard</label>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Semaine du plan</label>
            <select className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-xs" value={fl.week === null ? "" : fl.week} onChange={e => sFl(f => ({ ...f, week: e.target.value === "" ? null : +e.target.value }))}>
              <option value="">Toutes</option>
              <option value="0">0 — Non planifié</option>
              {Array.from({ length: 26 }, (_, i) => i + 1).map(w => <option key={w} value={w}>S{w}</option>)}
            </select>
          </div>
        </div>
      )}
      {vm === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.entries(kg).map(([s, sj]) => {
            const cfg = SC[s], I2 = cfg.i;
            return (
              <div key={s} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-100 dark:border-[#2A2D37] overflow-hidden">
                <div className={`px-4 py-3 border-b border-gray-100 dark:border-[#2A2D37] flex items-center gap-2 ${cfg.bg}`}>
                  <I2 size={16} className={cfg.t} />
                  <span className={`font-semibold text-sm ${cfg.t}`}>{cfg.l}</span>
                  <Bg className="bg-white dark:bg-gray-800 text-gray-600 ml-auto">{sj.length}</Bg>
                </div>
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {sj.map(x => (
                    <div key={x.id} className="p-3 rounded-lg bg-gray-50 dark:bg-[#252830] border border-gray-100 dark:border-[#2A2D37]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{x.nom}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{x.categorie}{x.semainePlan > 0 && ` • S${x.semainePlan}`}</p>
                        </div>
                        <PI priorite={x.priorite} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <CS value={x.confiance} size={12} />
                        <div className="flex gap-1">
                          {s !== "pas_commence" && <button onClick={() => dp({ type: "UPD_S", payload: { id: x.id, statut: s === "maitrise" ? "en_cours" : "pas_commence" } })} className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">←</button>}
                          {s !== "maitrise" && <button onClick={() => dp({ type: "UPD_S", payload: { id: x.id, statut: s === "pas_commence" ? "en_cours" : "maitrise" } })} className="text-[10px] text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20">→</button>}
                          <button onClick={() => sRs(x)} className="text-[10px] text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50">Rév.</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!sj.length && <p className="text-xs text-gray-400 text-center py-4">Vide</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {vm === "table" && (
        <>
          {fd2.length === 0 ? <ES icon={List} message="Aucun sujet." /> : (
            <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-100 dark:border-[#2A2D37] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2A2D37] text-gray-500">
                    {[{ k: "priorite", l: "Prio" }, { k: "nom", l: "Nom" }, { k: "categorie", l: "Cat." }, { k: "semainePlan", l: "S." }, { k: "statut", l: "Statut" }, { k: "confiance", l: "Conf." }, { k: "dateProchaineRevision", l: "Proch." }].map(c => (
                      <th key={c.k} className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => ts(c.k)}>
                        <span className="flex items-center gap-1">{c.l}{sk === c.k && <SI size={14} />}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Act.</th>
                  </tr>
                </thead>
                <tbody>
                  {fd2.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-[#252830] hover:bg-gray-50 dark:hover:bg-[#252830]">
                      <td className="px-4 py-3"><PI priorite={s.priorite} /></td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium max-w-xs truncate">{s.nom}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[120px] truncate">{s.categorie}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.semainePlan > 0 ? `S${s.semainePlan}` : "—"}</td>
                      <td className="px-4 py-3"><SB statut={s.statut} /></td>
                      <td className="px-4 py-3"><CS value={s.confiance} size={14} /></td>
                      <td className="px-4 py-3"><span className="text-gray-600 dark:text-gray-400 text-xs">{fsd(s.dateProchaineRevision)}</span>{isOv(s) && <Bg className="ml-1 bg-red-100 text-red-600 text-[10px]">!</Bg>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => sRs(s)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"><Check size={16} /></button>
                          <button onClick={() => { sEs(s); sFo(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={16} /></button>
                          <button onClick={() => sDt(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {fo && <SFM open={fo} onClose={() => { sFo(false); sEs(null); }} subject={es} state={st} dispatch={dp} />}
      <RM open={!!rs} onClose={() => sRs(null)} subject={rs} dispatch={dp} />
      <CM open={!!dt} onClose={() => sDt(null)} title="Supprimer" message={`Supprimer « ${dt?.nom} » ?`} onConfirm={() => {
        dp({ type: "PUSH_UNDO", payload: "Suppression de " + dt.nom });
        dp({ type: "TRASH_S", payload: dt.id });
        dp({ type: "TOAST", payload: { message: "Sujet supprimé", undoable: true } });
        sDt(null);
      }} />
    </div>
  );
}


// ============================================================================
// FLASHCARDS
// ============================================================================
function FV({ state: st, dispatch: dp }) {
  const due = useMemo(() => st.sujets.filter(s => isOv(s) || isDT(s)), [st.sujets]);
  const [idx, sIdx] = useState(0);
  const [flipped, sFl] = useState(false);
  const cur = due[idx];

  useEffect(() => { sFl(false); }, [idx]);

  if (!due.length) return <ES icon={Brain} message="Aucune carte à réviser aujourd'hui 🎉" />;
  if (!cur) return <ES icon={CheckCircle2} message="Session terminée !" action={<button onClick={() => { sIdx(0); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Recommencer</button>} />;

  const rate = (conf) => {
    dp({ type: "PUSH_UNDO", payload: "Flashcard : " + cur.nom });
    dp({ type: "REC_REV", payload: { sujetId: cur.id, newConfiance: conf } });
    dp({ type: "TOAST", payload: { message: `Révisé ✓ (+${cpt(cur, conf)} pts)` } });
    if (idx < due.length - 1) sIdx(i => i + 1);
    else sIdx(due.length);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Carte {idx + 1} / {due.length}</span>
        <PB value={idx + 1} max={due.length} className="flex-1 mx-4" />
        <span className="text-xs text-gray-400">{due.length - idx - 1} restantes</span>
      </div>
      <div className={`bg-white dark:bg-[#1A1D27] rounded-2xl p-8 border border-gray-100 dark:border-[#2A2D37] min-h-[300px] flex flex-col justify-center cursor-pointer transition-transform ${flipped ? "ring-2 ring-blue-500" : ""}`} onClick={() => sFl(f => !f)}>
        {!flipped ? (
          <>
            <div className="text-xs text-gray-400 mb-2">{cur.categorie}{cur.semainePlan > 0 && ` • S${cur.semainePlan}`}</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{cur.nom}</h2>
            <p className="text-sm text-gray-500 text-center mt-4">Cliquer pour voir les notes</p>
          </>
        ) : (
          <>
            <div className="text-xs text-gray-400 mb-2">Notes</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{cur.notes || "(aucune note)"}</div>
          </>
        )}
      </div>
      {flipped && (
        <div>
          <p className="text-center text-sm text-gray-500 mb-3">Confiance après révision ?</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(c => (
              <button key={c} onClick={() => rate(c)} className="px-4 py-3 rounded-lg font-bold text-white" style={{ backgroundColor: CC[c] }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// PLANNING
// ============================================================================
function PV({ state: st, dispatch: dp }) {
  const [rs, sRs] = useState(null);
  const grp = useMemo(() => {
    const ov = st.sujets.filter(isOv);
    const today = st.sujets.filter(s => isDT(s) && !isOv(s));
    const next7 = st.sujets.filter(s => {
      if (!s.dateProchaineRevision || isOv(s) || isDT(s)) return false;
      const d = db(td(), s.dateProchaineRevision);
      return d > 0 && d <= 7;
    });
    const later = st.sujets.filter(s => {
      if (!s.dateProchaineRevision) return false;
      return db(td(), s.dateProchaineRevision) > 7;
    });
    const pending = st.sujets.filter(s => !s.dateProchaineRevision);
    return { ov, today, next7, later, pending };
  }, [st.sujets]);

  const Section = ({ title, color, items, icon: I }) => {
    if (!items.length) return null;
    return (
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-100 dark:border-[#2A2D37] overflow-hidden">
        <div className={`px-4 py-3 border-b border-gray-100 dark:border-[#2A2D37] flex items-center gap-2 ${color}`}>
          <I size={16} />
          <span className="font-semibold text-sm">{title}</span>
          <Bg className="bg-white/70 dark:bg-black/20 ml-auto">{items.length}</Bg>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-[#252830]">
          {items.map(s => (
            <div key={s.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#252830]">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.nom}</p>
                <p className="text-[10px] text-gray-400">{s.categorie} • {fsd(s.dateProchaineRevision)}{s.semainePlan > 0 && ` • S${s.semainePlan}`}</p>
              </div>
              <button onClick={() => sRs(s)} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded font-medium shrink-0 ml-2">Réviser</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Section title="En retard" color="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" icon={AlertTriangle} items={grp.ov} />
      <Section title="Aujourd'hui" color="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" icon={Target} items={grp.today} />
      <Section title="7 prochains jours" color="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" icon={CalendarDays} items={grp.next7} />
      <Section title="Plus tard" color="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400" icon={Clock} items={grp.later} />
      <Section title="Jamais révisé" color="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" icon={Circle} items={grp.pending} />
      <RM open={!!rs} onClose={() => sRs(null)} subject={rs} dispatch={dp} />
    </div>
  );
}


// ============================================================================
// SESSIONS
// ============================================================================
function FatigueAlert({ state }) {
  if (!state.session) return null;
  const s = state.session;
  const el = s.paused ? s.pausedElapsed : (Date.now() - s.startTime);
  const min = Math.floor(el / 60000);
  const n = s.currentIndex;
  const show = min >= state.settings.alerteFatigueMin || n >= state.settings.alerteFatigueSujets;
  if (!show) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm">
      <Coffee size={16} />
      <span>Session longue ({min} min, {n} sujets) — pause recommandée.</span>
    </div>
  );
}

function PostSessionEval({ open, onClose, sessionData, dispatch }) {
  const [diff, sDiff] = useState(3);
  const [fatigue, sFat] = useState(3);
  const [notes, sNotes] = useState("");
  if (!open || !sessionData) return null;
  const save = () => {
    dispatch({ type: "LOG_SESSION", payload: { ...sessionData, difficulte: diff, fatigue, notes, date: new Date().toISOString() } });
    dispatch({ type: "TOAST", payload: { message: "Session enregistrée ✓" } });
    dispatch({ type: "CLEAR_EVAL" });
    onClose();
  };
  return (
    <Md open={open} onClose={onClose} title="Bilan de session">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {sessionData.nbSujets} sujets révisés en {Math.round(sessionData.dureeMinutes)} min
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Difficulté ressentie</label>
          <CS value={diff} onChange={sDiff} size={24} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Fatigue (1=frais, 5=épuisé)</label>
          <CS value={fatigue} onChange={sFat} size={24} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes (optionnel)</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-sm h-20 resize-none" value={notes} onChange={e => sNotes(e.target.value.slice(0, 500))} />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#2A2D37]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 rounded-lg">Passer</button>
          <button onClick={save} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Enregistrer</button>
        </div>
      </div>
    </Md>
  );
}

function SeV({ state: st, dispatch: dp }) {
  const s = st.session;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!s || s.paused) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [s, s?.paused]);

  const startNew = (size) => {
    const rec = gsr(st.sujets, size);
    if (!rec.length) {
      dp({ type: "TOAST", payload: { message: "Aucun sujet à réviser" } });
      return;
    }
    dp({ type: "START_S", payload: { queue: rec.map(x => x.id), currentIndex: 0, results: [], startTime: Date.now(), paused: false, pausedElapsed: 0 } });
  };

  if (!s) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-6 border border-gray-100 dark:border-[#2A2D37] text-center">
          <Play size={48} className="mx-auto text-blue-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nouvelle session</h2>
          <p className="text-sm text-gray-500 mb-6">Recommandations prioritaires basées sur le retard, la priorité et la confiance.</p>
          <div className="grid grid-cols-3 gap-3">
            {[5, 10, 20].map(n => (
              <button key={n} onClick={() => startNew(n)} className="py-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 font-semibold">
                {n} sujets
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const curId = s.queue[s.currentIndex];
  const cur = st.sujets.find(x => x.id === curId);
  const done = s.currentIndex >= s.queue.length;
  const el = s.paused ? s.pausedElapsed : (Date.now() - s.startTime);
  const mm = String(Math.floor(el / 60000)).padStart(2, "0");
  const ss = String(Math.floor(el / 1000) % 60).padStart(2, "0");

  if (done) {
    const total = s.results.length;
    const avg = total > 0 ? _.meanBy(s.results, "conf") : 0;
    const totalMin = el / 60000;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-6 border border-gray-100 dark:border-[#2A2D37] text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session terminée !</h2>
          <p className="text-sm text-gray-500 mb-6">{total} sujets révisés en {mm}:{ss} (conf. moyenne {avg.toFixed(1)}/5)</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => {
              dp({ type: "SET_EVAL", payload: { nbSujets: total, dureeMinutes: totalMin } });
              dp({ type: "END_S" });
            }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Bilan</button>
            <button onClick={() => dp({ type: "END_S" })} className="px-4 py-2 text-gray-600 rounded-lg">Fermer</button>
          </div>
        </div>
        {st.sessionEval && <PostSessionEval open={!!st.sessionEval} onClose={() => dp({ type: "CLEAR_EVAL" })} sessionData={st.sessionEval} dispatch={dp} />}
      </div>
    );
  }

  if (!cur) { dp({ type: "END_S" }); return null; }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <FatigueAlert state={st} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{s.currentIndex + 1} / {s.queue.length}</span>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Timer size={14} /><span className="font-mono text-sm">{mm}:{ss}</span></div>
        <div className="flex gap-1">
          <button onClick={() => dp({ type: "TOG_P" })} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600">{s.paused ? <Play size={14} /> : <Pause size={14} />}</button>
          <button onClick={() => dp({ type: "END_S" })} className="p-1.5 rounded-lg bg-red-100 text-red-600"><X size={14} /></button>
        </div>
      </div>
      <PB value={s.currentIndex} max={s.queue.length} />
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-6 border border-gray-100 dark:border-[#2A2D37]">
        <div className="text-xs text-gray-400 mb-2">{cur.categorie}{cur.semainePlan > 0 && ` • S${cur.semainePlan}`} • <span style={{ color: gd(cur.categorie).color }}>{gd(cur.categorie).label}</span></div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{cur.nom}</h3>
        {cur.notes && <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252830] text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">{cur.notes}</div>}
        <div className="pt-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Confiance après révision ?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(c => (
              <button key={c} onClick={() => {
                dp({ type: "PUSH_UNDO", payload: "Session : " + cur.nom });
                dp({ type: "REC_REV", payload: { sujetId: cur.id, newConfiance: c } });
                dp({ type: "S_NEXT", payload: { sujetId: cur.id, conf: c } });
              }} className="flex-1 py-3 rounded-lg font-bold text-white" style={{ backgroundColor: CC[c] }}>{c}</button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => dp({ type: "S_NEXT", payload: { sujetId: cur.id, conf: cur.confiance, skipped: true } })} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"><SkipForward size={14} />Passer</button>
    </div>
  );
}


// ============================================================================
// STATISTIQUES
// ============================================================================
function StV({ state: st }) {
  const catData = useMemo(() => {
    return st.settings.categoriesDisponibles.map(c => {
      const ds = st.sujets.filter(s => s.categorie === c);
      if (!ds.length) return null;
      return {
        name: c.slice(0, 20),
        maitrise: ds.filter(s => s.statut === "maitrise").length,
        en_cours: ds.filter(s => s.statut === "en_cours").length,
        pas_commence: ds.filter(s => s.statut === "pas_commence").length
      };
    }).filter(Boolean);
  }, [st.sujets, st.settings.categoriesDisponibles]);

  const revData = useMemo(() => {
    const m = {};
    st.sujets.forEach(s => {
      (s.historiqueRevisions || []).forEach(r => {
        const d = r.date.split("T")[0];
        m[d] = (m[d] || 0) + 1;
      });
    });
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const dt = ad(new Date().toISOString(), -i).split("T")[0];
      arr.push({ date: new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), n: m[dt] || 0 });
    }
    return arr;
  }, [st.sujets]);

  const confDist = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    st.sujets.forEach(s => { dist[s.confiance] = (dist[s.confiance] || 0) + 1; });
    return Object.entries(dist).map(([k, v]) => ({ conf: `${k}★`, n: v, fill: CC[k] }));
  }, [st.sujets]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Révisions (30 derniers jours)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="n" fill="#2563EB" name="Révisions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Distribution de confiance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="conf" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="n">{confDist.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Répartition par statut</h3>
          <div className="space-y-2 mt-4">
            {Object.entries(SC).map(([k, v]) => {
              const n = st.sujets.filter(s => s.statut === k).length;
              const p = st.sujets.length > 0 ? Math.round(n / st.sujets.length * 100) : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={v.t}>{v.l}</span>
                    <span className="text-gray-600 dark:text-gray-400">{n} ({p}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: v.c }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Par catégorie</h3>
        <ResponsiveContainer width="100%" height={Math.max(300, catData.length * 25)}>
          <BarChart data={catData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="maitrise" stackId="a" fill="#059669" name="Maîtrisé" />
            <Bar dataKey="en_cours" stackId="a" fill="#2563EB" name="En cours" />
            <Bar dataKey="pas_commence" stackId="a" fill="#6B7280" name="Non commencé" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// INSIGHTS
// ============================================================================
function InsV({ state: st, dispatch: dp }) {
  const tab = st.insightsTab || "readiness";
  const fragiles = useMemo(() => st.sujets.filter(isFragile), [st.sujets]);
  const surappr = useMemo(() => st.sujets.filter(isSurapprentissage), [st.sujets]);
  const forces = useMemo(() => _.orderBy(
    st.settings.categoriesDisponibles.map(c => ({ cat: c, score: getForceScore(st.sujets, c), n: st.sujets.filter(s => s.categorie === c).length })).filter(x => x.n > 0),
    "score", "desc"
  ), [st.sujets, st.settings.categoriesDisponibles]);
  const faiblesses = useMemo(() => [...forces].reverse().filter(f => f.score < 60), [forces]);

  const tabs = [
    { id: "readiness", label: "Préparation", icon: Target },
    { id: "retention", label: "Rétention", icon: Brain },
    { id: "patterns", label: "Patterns", icon: Activity },
    { id: "forces", label: "Forces/Faiblesses", icon: Heart },
    { id: "report", label: "Rapport", icon: Flag }
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => dp({ type: "SET_ITAB", payload: t.id })} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 ${tab === t.id ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400"}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      {tab === "readiness" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExamReadinessGauge sujets={st.sujets} />
          <DWB sujets={st.sujets} />
        </div>
      )}
      {tab === "retention" && (
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Rétention moyenne par sujet (parmi ceux avec ≥2 révisions)</h3>
          {st.sujets.filter(s => calcRetention(s) !== null).length === 0 ? (
            <p className="text-sm text-gray-400">Pas encore assez de données.</p>
          ) : (
            <div className="space-y-1">
              {_.orderBy(st.sujets.filter(s => calcRetention(s) !== null), s => calcRetention(s), "asc").slice(0, 15).map(s => {
                const r = calcRetention(s);
                const c = r < 40 ? "#DC2626" : r < 60 ? "#F97316" : r < 75 ? "#EAB308" : "#059669";
                return (
                  <div key={s.id} className="flex items-center gap-3 py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{s.nom}</span>
                    <div className="w-32 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full" style={{ width: `${r}%`, backgroundColor: c }} />
                    </div>
                    <span className="text-xs font-mono w-10 text-right" style={{ color: c }}>{r}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {tab === "patterns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-500" />Sujets fragiles ({fragiles.length})</h3>
            {fragiles.length === 0 ? <p className="text-sm text-gray-400">Aucun sujet fragile 🎉</p> : (
              <div className="space-y-1">
                {fragiles.slice(0, 10).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{s.nom}</span>
                    <CS value={s.confiance} size={12} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Zap size={16} className="text-purple-500" />Sur-apprentissage détecté ({surappr.length})</h3>
            {surappr.length === 0 ? <p className="text-sm text-gray-400">Aucun sur-apprentissage.</p> : (
              <>
                <p className="text-xs text-gray-400 mb-2">Ces sujets maîtrisés à 5/5 sont révisés trop souvent — déprioriser au profit des sujets fragiles.</p>
                <div className="space-y-1">
                  {surappr.slice(0, 10).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{s.nom}</span>
                      <span className="text-xs text-purple-600">{(s.historiqueRevisions || []).length} rév.</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {tab === "forces" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Award size={16} className="text-emerald-500" />Top forces</h3>
            <div className="space-y-2">
              {forces.slice(0, 5).map(f => (
                <div key={f.cat} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{f.cat}</span>
                  <span className="text-sm font-bold text-emerald-600">{f.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-red-500" />À travailler en priorité</h3>
            {faiblesses.length === 0 ? <p className="text-sm text-gray-400">Aucune faiblesse majeure.</p> : (
              <div className="space-y-2">
                {faiblesses.slice(0, 5).map(f => (
                  <div key={f.cat} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{f.cat}</span>
                    <span className="text-sm font-bold text-red-500">{f.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "report" && (
        <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37] space-y-3 text-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rapport synthétique</h3>
          <p className="text-gray-600 dark:text-gray-400">• {st.sujets.length} sujets au total, {st.sujets.filter(s => s.statut === "maitrise").length} maîtrisés.</p>
          <p className="text-gray-600 dark:text-gray-400">• Score de préparation actuel : <strong>{calcExamReadiness(st.sujets)}%</strong>.</p>
          <p className="text-gray-600 dark:text-gray-400">• Streak actuel : {st.motivation.streakActuel} jours (record : {st.motivation.streakMax}).</p>
          <p className="text-gray-600 dark:text-gray-400">• Sujets fragiles : {fragiles.length}.</p>
          <p className="text-gray-600 dark:text-gray-400">• Sujets surappris (à déprioriser) : {surappr.length}.</p>
          {st.settings.dateExamen && <p className="text-gray-600 dark:text-gray-400">• J-{db(td(), st.settings.dateExamen)} avant l'examen ({fd(st.settings.dateExamen)}).</p>}
          <p className="text-xs text-gray-400 italic pt-2 border-t border-gray-100 dark:border-[#2A2D37]">Indicateurs personnels basés sur votre auto-évaluation. Ne prédisent pas le résultat officiel.</p>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// CHECKPOINT MODAL — S4 / S10 / S16
// ============================================================================
function CheckpointModal({ open, onClose, checkpoint, state, dispatch }) {
  const existing = state.settings.checkpointsLog?.[checkpoint?.id];
  const [reponses, sRep] = useState({});
  const [notes, sNotes] = useState("");
  const [readonly, sRO] = useState(false);

  useEffect(() => {
    if (existing) {
      sRep(existing.reponses || {});
      sNotes(existing.notes || "");
      sRO(true);
    } else {
      sRep({});
      sNotes("");
      sRO(false);
    }
  }, [checkpoint?.id, existing]);

  if (!checkpoint) return null;

  const nbOui = Object.values(reponses).filter(v => v === true).length;
  const nbRep = Object.values(reponses).filter(v => v !== undefined && v !== null).length;
  const totalQ = checkpoint.questions.length;
  const pctOui = nbRep > 0 ? (nbOui / totalQ) * 100 : 0;
  const trajectoire = pctOui >= 80 ? "green" : pctOui >= 50 ? "yellow" : "red";
  const trajLabel = { green: "Trajectoire verte — dans les temps", yellow: "Trajectoire jaune — léger retard", red: "Trajectoire rouge — retard important" }[trajectoire];
  const trajColor = { green: "#059669", yellow: "#EAB308", red: "#DC2626" }[trajectoire];

  const save = () => {
    if (nbRep < totalQ) {
      dispatch({ type: "TOAST", payload: { message: "Réponds à toutes les questions avant d'enregistrer." } });
      return;
    }
    dispatch({ type: "SAVE_CHECKPOINT", payload: { id: checkpoint.id, reponses, trajectoire, notes } });
    dispatch({ type: "TOAST", payload: { message: `Checkpoint ${checkpoint.id.toUpperCase()} enregistré ✓` } });
    onClose();
  };

  const redo = () => { sRO(false); sRep({}); sNotes(""); };

  return (
    <Md open={open} onClose={onClose} title={checkpoint.titre} wide>
      <div className="space-y-4">
        {readonly && existing && (
          <div className="bg-gray-50 dark:bg-[#252830] rounded-lg p-3 text-sm flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Complété le {fd(existing.date)}</span>
            <button onClick={redo} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-medium">Refaire</button>
          </div>
        )}
        <div className="space-y-3">
          {checkpoint.questions.map(q => (
            <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#2A2D37]">
              <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{q.label}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => sRep(r => ({ ...r, [q.id]: true }))}
                  className={`px-3 py-1 rounded text-xs font-medium ${reponses[q.id] === true ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600"} ${readonly ? "opacity-60 cursor-not-allowed" : ""}`}
                >Oui</button>
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => sRep(r => ({ ...r, [q.id]: false }))}
                  className={`px-3 py-1 rounded text-xs font-medium ${reponses[q.id] === false ? "bg-red-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600"} ${readonly ? "opacity-60 cursor-not-allowed" : ""}`}
                >Non</button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes (optionnel)</label>
          <textarea
            disabled={readonly}
            className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-sm h-20 resize-none ${readonly ? "opacity-60" : ""}`}
            value={notes}
            onChange={e => sNotes(e.target.value.slice(0, 500))}
            placeholder="Observations, ajustements à prévoir…"
          />
        </div>
        {nbRep > 0 && (
          <div className="p-3 rounded-lg border-2" style={{ borderColor: trajColor, backgroundColor: `${trajColor}15` }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: trajColor }}>{trajLabel}</span>
              <span className="text-sm" style={{ color: trajColor }}>{nbOui}/{totalQ} ({Math.round(pctOui)}%)</span>
            </div>
          </div>
        )}
        {!readonly && (
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#2A2D37]">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 rounded-lg">Annuler</button>
            <button onClick={save} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Enregistrer</button>
          </div>
        )}
      </div>
    </Md>
  );
}

// ============================================================================
// VUE PLAN 26 SEMAINES
// ============================================================================
function PlanView({ state: st, dispatch: dp }) {
  const [openCP, sOpenCP] = useState(null);

  if (!st.settings.dateExamen) {
    return (
      <ES
        icon={Map}
        message="Renseigne ta date d'examen dans les Paramètres pour afficher le plan 26 semaines."
        action={<button onClick={() => dp({ type: "SET_VIEW", payload: "settings" })} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Aller aux paramètres</button>}
      />
    );
  }

  const startDate = getPlanStartDate(st.settings.dateExamen);
  const curWeek = getPlanWeek(td(), st.settings.dateExamen);
  const today = td();

  return (
    <div className="space-y-6">
      {/* En-tête récap */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold">Plan d'étude PEBC — 26 semaines</h3>
            <p className="text-indigo-100 text-sm mt-1">S1 : {fd(startDate)} → S26 (examen) : {fd(st.settings.dateExamen)}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">
              {curWeek === 0 ? "Avant S1" : curWeek > 26 ? "Après S26" : `S${curWeek}`}
            </div>
            <div className="text-indigo-200 text-xs">Semaine courante</div>
          </div>
        </div>
      </div>

      {/* Liste des phases */}
      {PHASES_PLAN.map(phase => {
        const phaseSujets = st.sujets.filter(s => phase.semaines.includes(s.semainePlan));
        const traj = getTrajectoire(phase, st.sujets, curWeek);
        const trajBg = { green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700", yellow: "bg-amber-100 dark:bg-amber-900/30 text-amber-700", red: "bg-red-100 dark:bg-red-900/30 text-red-700", gray: "bg-gray-100 dark:bg-gray-700 text-gray-500" }[traj.color];

        return (
          <div key={phase.id} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-100 dark:border-[#2A2D37] overflow-hidden">
            {/* Header phase */}
            <div className="p-4 border-b border-gray-100 dark:border-[#2A2D37]" style={{ backgroundColor: `${phase.couleur}15` }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.couleur }} />
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">Phase {phase.numero} — {phase.nom}</h4>
                  <span className="text-xs text-gray-500">S{Math.min(...phase.semaines)}–S{Math.max(...phase.semaines)} • {phase.heures}h</span>
                </div>
                <Bg className={trajBg}>{traj.label} ({traj.pct}%)</Bg>
              </div>
              <p className="text-xs text-gray-500 mt-1">{phase.focus}</p>
            </div>

            {/* Liste des semaines */}
            <div className="divide-y divide-gray-50 dark:divide-[#252830]">
              {phase.semaines.map(w => {
                const wSujets = st.sujets.filter(s => s.semainePlan === w);
                const wMaitrise = wSujets.filter(s => s.statut === "maitrise").length;
                const wPct = calcCompletionPct(wSujets);
                const wStart = getWeekStartDate(w, st.settings.dateExamen);
                const wEnd = wStart ? ad(new Date(wStart).toISOString(), 6).split("T")[0] : null;
                const isCurrent = curWeek === w;
                const cp = CHECKPOINTS_DEF.find(c => c.semaine === w);
                const cpDone = cp && !!st.settings.checkpointsLog?.[cp.id];

                return (
                  <div key={w} className={`p-3 ${isCurrent ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">S{w}</span>
                        {isCurrent && <Bg className="bg-blue-600 text-white text-[10px]">Semaine courante</Bg>}
                        <span className="text-xs text-gray-500">{fsd(wStart)} → {fsd(wEnd)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cp && (
                          <button onClick={() => sOpenCP(cp)} className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${cpDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
                            <ClipboardCheck size={12} />
                            {cpDone ? "Checkpoint fait" : "Faire le checkpoint"}
                          </button>
                        )}
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{wMaitrise}/{wSujets.length} maîtrisés</span>
                      </div>
                    </div>
                    {wSujets.length > 0 ? (
                      <>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                          <div className="h-full rounded-full transition-all" style={{ width: `${wPct}%`, backgroundColor: phase.couleur }} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {wSujets.map(s => {
                            const sc = SC[s.statut];
                            return (
                              <span key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded ${sc.bg} ${sc.t}`} title={`${s.nom} — ${sc.l}`}>
                                {s.nom.slice(0, 30)}{s.nom.length > 30 ? "…" : ""}
                              </span>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        {w <= 23 ? "Aucun sujet assigné (révisions générales / travail opportuniste)" : w === 24 ? "Examen blanc #1 + debrief (pas de sujet spécifique)" : w === 25 ? "Révision sujets fragiles identifiés" : "Examen blanc #2 + J-J (révision ciblée)"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Note sur les sujets non planifiés */}
      {(() => {
        const unplanned = st.sujets.filter(s => s.semainePlan === 0);
        if (!unplanned.length) return null;
        return (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              {unplanned.length} sujets non assignés au plan v3
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Ces sujets (dermato, anémies, VIH, oncologie, etc.) ne figurent pas nommément dans les 22 premières semaines du plan v3. Ils seront intégrés aux Phases 5-6 (révisions intensives S23-S26) ou abordés opportunément selon les besoins identifiés.
            </p>
          </div>
        );
      })()}

      <CheckpointModal open={!!openCP} onClose={() => sOpenCP(null)} checkpoint={openCP} state={st} dispatch={dp} />
    </div>
  );
}


// ============================================================================
// PARAMÈTRES (sans PrepCalc, avec note méthodologique PEBC)
// ============================================================================
function SetV({ state: st, dispatch: dp }) {
  const [showTrash, sShowTrash] = useState(false);
  const [confirmReset, sConfirmReset] = useState(false);
  const fileRef = useRef(null);

  const exportJSON = () => {
    const data = { sujets: st.sujets, settings: st.settings, motivation: st.motivation, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `revtracker-pebc-${td()}.json`; a.click();
    URL.revokeObjectURL(url);
    dp({ type: "TOAST", payload: { message: "Exporté ✓" } });
  };

  const exportCSV = () => {
    const h = ["id", "nom", "categorie", "priorite", "statut", "confiance", "semainePlan", "dateDerniereRevision", "dateProchaineRevision", "notes"];
    const rows = st.sujets.map(s => h.map(k => JSON.stringify(s[k] ?? "")).join(","));
    const csv = [h.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `revtracker-pebc-${td()}.csv`; a.click();
    URL.revokeObjectURL(url);
    dp({ type: "TOAST", payload: { message: "CSV exporté ✓" } });
  };

  const importJSON = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.sujets) throw new Error("Format invalide");
        dp({ type: "IMP", payload: { sujets: data.sujets, settings: data.settings || st.settings, motivation: data.motivation || st.motivation } });
        dp({ type: "TOAST", payload: { message: "Import réussi ✓" } });
      } catch (err) {
        dp({ type: "TOAST", payload: { message: "Échec import : " + err.message } });
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const addMilestone = () => {
    const label = prompt("Libellé du jalon :");
    if (!label) return;
    const date = prompt("Date (AAAA-MM-JJ, optionnel) :") || "";
    dp({ type: "ADD_ML", payload: { id: uid(), label, date, atteint: false } });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#252830] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Date d'examen */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Date d'examen</h3>
        <input
          type="date"
          className={inputCls}
          value={st.settings.dateExamen ? st.settings.dateExamen.split("T")[0] : ""}
          onChange={e => dp({ type: "UPD_SET", payload: { dateExamen: e.target.value ? new Date(e.target.value).toISOString() : null } })}
        />
        {st.settings.dateExamen && (
          <p className="text-xs text-gray-500 mt-2">
            La Semaine 1 du plan commence le <strong>{fd(getPlanStartDate(st.settings.dateExamen))}</strong> (26 semaines avant).
          </p>
        )}
      </div>

      {/* Jalons */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Jalons</h3>
          <button onClick={addMilestone} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded flex items-center gap-1"><Plus size={12} />Ajouter</button>
        </div>
        <div className="space-y-2">
          {st.settings.jalons.map(j => (
            <div key={j.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-[#252830]">
              <input type="checkbox" checked={j.atteint} onChange={() => dp({ type: "TOG_ML", payload: j.id })} />
              <span className={`flex-1 text-sm ${j.atteint ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>{j.label}</span>
              {j.date && <span className="text-xs text-gray-400">{j.date}</span>}
              <button onClick={() => dp({ type: "DEL_ML", payload: j.id })} className="text-red-500 hover:text-red-700"><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Objectifs quotidiens */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Objectifs quotidiens</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={st.settings.objectifsActifs} onChange={e => dp({ type: "UPD_SET", payload: { objectifsActifs: e.target.checked } })} />
            Actif
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sujets/jour</label>
            <input type="number" min={0} className={inputCls} value={st.settings.objectifs.quotidien.nbSujets} onChange={e => dp({ type: "UPD_SET", payload: { objectifs: { ...st.settings.objectifs, quotidien: { ...st.settings.objectifs.quotidien, nbSujets: +e.target.value || 0 } } } })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Minutes/jour</label>
            <input type="number" min={0} className={inputCls} value={st.settings.objectifs.quotidien.dureeMinutes} onChange={e => dp({ type: "UPD_SET", payload: { objectifs: { ...st.settings.objectifs, quotidien: { ...st.settings.objectifs.quotidien, dureeMinutes: +e.target.value || 0 } } } })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Points/jour</label>
            <input type="number" min={0} className={inputCls} value={st.settings.objectifs.quotidien.points} onChange={e => dp({ type: "UPD_SET", payload: { objectifs: { ...st.settings.objectifs, quotidien: { ...st.settings.objectifs.quotidien, points: +e.target.value || 0 } } } })} />
          </div>
        </div>
      </div>

      {/* Alertes fatigue */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Alertes de fatigue en session</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Seuil durée (min)</label>
            <input type="number" min={0} className={inputCls} value={st.settings.alerteFatigueMin} onChange={e => dp({ type: "UPD_SET", payload: { alerteFatigueMin: +e.target.value || 0 } })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Seuil nb sujets</label>
            <input type="number" min={0} className={inputCls} value={st.settings.alerteFatigueSujets} onChange={e => dp({ type: "UPD_SET", payload: { alerteFatigueSujets: +e.target.value || 0 } })} />
          </div>
        </div>
      </div>

      {/* Import / Export */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Données</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJSON} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"><Download size={14} />Export JSON</button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"><Download size={14} />Export CSV</button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"><Upload size={14} />Import JSON</button>
          <input type="file" ref={fileRef} accept=".json" onChange={importJSON} className="hidden" />
        </div>
      </div>

      {/* Corbeille */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Corbeille ({st.trash.length})</h3>
          <button onClick={() => sShowTrash(s => !s)} className="text-xs text-blue-600">{showTrash ? "Masquer" : "Afficher"}</button>
        </div>
        {showTrash && (
          <>
            {!st.trash.length ? <p className="text-sm text-gray-400">Vide.</p> : (
              <div className="space-y-1">
                {st.trash.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-[#252830]">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{s.nom}</span>
                    <button onClick={() => { dp({ type: "RESTORE_S", payload: s.id }); dp({ type: "TOAST", payload: { message: "Restauré ✓" } }); }} className="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50">Restaurer</button>
                  </div>
                ))}
                <button onClick={() => { dp({ type: "EMPTY_TRASH" }); dp({ type: "TOAST", payload: { message: "Corbeille vidée" } }); }} className="text-xs text-red-600 mt-2">Vider la corbeille</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Zone de danger */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl p-5 border border-red-200 dark:border-red-900">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">Zone de danger</h3>
        <button onClick={() => sConfirmReset(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"><RotateCcw size={14} />Réinitialiser toutes les données</button>
      </div>

      {/* Note méthodologique */}
      <div className="bg-gray-50 dark:bg-[#1A1D27] rounded-xl p-5 border border-gray-100 dark:border-[#2A2D37]">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">Note méthodologique</h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
          <p>
            Cet outil est un tracker personnel d'étude. Les indicateurs qu'il affiche (score de préparation, rétention, forces/faiblesses) sont basés exclusivement sur ton auto-évaluation. <strong>Aucun de ces indicateurs ne prédit le résultat de l'examen officiel.</strong>
          </p>
          <p>
            <strong>Source officielle unique :</strong> <a href="https://www.pebc.ca" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">pebc.ca</a> (Pharmacy Examining Board of Canada). Le PEBC est la seule autorité pour le blueprint, les dates, les frais, les taux de réussite et le contenu de l'examen.
          </p>
          <p>
            Le PEBC <strong>n'endosse aucun cours, manuel ou QBank commercial</strong>. Cet outil non plus : aucune recommandation de ressource payante tierce n'est faite ici.
          </p>
          <p>Données vérifiées (site pebc.ca consulté le 16 avril 2026) :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Format : 140 QCM en 2 sections de 70, 90 min par section.</li>
            <li>Pondération : Sciences pharmaceutiques 25 % / Pratique pharmaceutique 55 % / Sciences comportementales 20 %.</li>
            <li>Seuil de réussite : 60 % (≥ 84/140), pass/fail.</li>
            <li>Taux de réussite 1ère tentative (2021-2024) : 36,2 %.</li>
            <li>Maximum 4 tentatives.</li>
          </ul>
        </div>
      </div>

      <CM
        open={confirmReset}
        onClose={() => sConfirmReset(false)}
        title="Réinitialiser tout ?"
        message="Cette action supprime définitivement tous tes sujets, révisions, statistiques et paramètres. Elle est irréversible."
        confirmLabel="Tout réinitialiser"
        onConfirm={() => {
          dp({ type: "RESET" });
          dp({ type: "TOAST", payload: { message: "Données réinitialisées" } });
          sConfirmReset(false);
        }}
      />
    </div>
  );
}


// ============================================================================
// COMPOSANT RACINE
// ============================================================================
export default function App() {
  const [state, dispatch] = useReducer(R, DS);
  const [mobileMenu, sMM] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(false);

  // Détecte la transition "non_commence" → "en_cours" pour ouvrir
  // automatiquement la modale d'onboarding (clic Commencer ou Démarrer).
  // initRef évite de confondre l'hydratation initiale depuis localStorage
  // (qui peut elle-même faire transiter le statut de DS "non_commence" vers
  // une valeur sauvegardée) avec une vraie action utilisateur.
  // Si le state initial est modifié plus tard (autre statut de départ
  // que "non_commence"), vérifier ce code.
  const prevStatutRef = useRef(null);
  const initRef = useRef(false);
  useEffect(() => {
    if (!state.loaded) return;
    const cur = state.settings.onboarding.statut;
    if (!initRef.current) {
      // Premier passage après hydratation : on enregistre l'état
      // courant sans déclencher d'action.
      prevStatutRef.current = cur;
      initRef.current = true;
      return;
    }
    if (prevStatutRef.current === "non_commence" && cur === "en_cours") {
      setOnboardingActive(true);
    }
    prevStatutRef.current = cur;
  }, [state.settings.onboarding.statut, state.loaded]);

  // Chargement initial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [su, se, mo, tr] = await Promise.all([
        storage.get("sujets"),
        storage.get("settings"),
        storage.get("motivation"),
        storage.get("trash")
      ]);
      if (cancelled) return;
      const parse = (v) => { try { return v ? JSON.parse(v.value) : null; } catch { return null; } };
      dispatch({
        type: "LOAD_DATA",
        payload: {
          sujets: parse(su),
          settings: parse(se),
          motivation: parse(mo)
        }
      });
      const trashData = parse(tr);
      if (trashData) dispatch({ type: "IMP", payload: { trash: trashData } });
      dispatch({ type: "CLEAN_TRASH" });
    })();
    return () => { cancelled = true; };
  }, []);

  // Sauvegarde automatique (debounced)
  useEffect(() => {
    if (!state.loaded) return;
    sv(state);
  }, [state.sujets, state.settings, state.motivation, state.trash, state.loaded]);

  // Thème
  useEffect(() => {
    if (state.theme === "sombre") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [state.theme]);

  if (!state.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F1117]">
        <div className="text-gray-500">Chargement…</div>
      </div>
    );
  }

  const renderView = () => {
    switch (state.view) {
      case "dashboard": return <DV state={state} dispatch={dispatch} />;
      case "plan": return <PlanView state={state} dispatch={dispatch} />;
      case "subjects": return <SV state={state} dispatch={dispatch} />;
      case "flashcards": return <FV state={state} dispatch={dispatch} />;
      case "planning": return <PV state={state} dispatch={dispatch} />;
      case "sessions": return <SeV state={state} dispatch={dispatch} />;
      case "stats": return <StV state={state} />;
      case "insights": return <InsV state={state} dispatch={dispatch} />;
      case "settings": return <SetV state={state} dispatch={dispatch} />;
      default: return <DV state={state} dispatch={dispatch} />;
    }
  };

  const currentNav = NAV.find(n => n.id === state.view) || NAV[0];

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-[#0F1117] text-gray-900 dark:text-gray-100`}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-gray-200 dark:border-[#2A2D37] bg-white dark:bg-[#1A1D27] z-30">
        <div className="p-5 border-b border-gray-100 dark:border-[#2A2D37]">
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">RevTracker</h1>
          <p className="text-xs text-gray-500">PEBC • 15 oct. 2026</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => dispatch({ type: "SET_VIEW", payload: n.id })} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${state.view === n.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252830]"}`}>
              <n.icon size={16} />{n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-[#2A2D37]">
          <button onClick={() => dispatch({ type: "SET_THEME", payload: state.theme === "sombre" ? "clair" : "sombre" })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252830]">
            {state.theme === "sombre" ? <Sun size={16} /> : <Moon size={16} />}
            {state.theme === "sombre" ? "Clair" : "Sombre"}
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-[#1A1D27] border-b border-gray-200 dark:border-[#2A2D37] px-4 py-3 flex items-center gap-3">
        <button onClick={() => sMM(m => !m)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Menu size={20} /></button>
        <div className="flex-1">
          <h1 className="text-base font-bold">RevTracker</h1>
          <p className="text-xs text-gray-500">{currentNav.label}</p>
        </div>
        <button onClick={() => dispatch({ type: "SET_THEME", payload: state.theme === "sombre" ? "clair" : "sombre" })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          {state.theme === "sombre" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Menu mobile */}
      {mobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => sMM(false)}>
          <nav className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-[#1A1D27] p-3 space-y-1" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-100 dark:border-[#2A2D37] mb-2">
              <h1 className="font-bold">RevTracker</h1>
              <p className="text-xs text-gray-500">PEBC • 15 oct. 2026</p>
            </div>
            {NAV.map(n => (
              <button key={n.id} onClick={() => { dispatch({ type: "SET_VIEW", payload: n.id }); sMM(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${state.view === n.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                <n.icon size={16} />{n.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Contenu principal */}
      <main className="lg:ml-60 p-4 lg:p-8">
        <div className="mb-4 hidden lg:block">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentNav.label}</h1>
        </div>
        {state.view === "dashboard" && (
          <OnboardingResumeBanner
            state={state}
            dispatch={dispatch}
            onResume={() => setOnboardingActive(true)}
          />
        )}
        {renderView()}
      </main>

      {/* Toasts globaux */}
      <TC toasts={state.toasts} dispatch={dispatch} />

      {/* Modal d'évaluation post-session (niveau app) */}
      {state.sessionEval && (
        <PostSessionEval
          open={!!state.sessionEval}
          onClose={() => dispatch({ type: "CLEAR_EVAL" })}
          sessionData={state.sessionEval}
          dispatch={dispatch}
        />
      )}

      {/* Onboarding (niveau app) */}
      <OnboardingWelcomeModal
        open={
          state.settings.onboarding.statut === "non_commence"
          && !state.settings.onboarding.welcomeDismissed
          && state.motivation.historiqueJournalier.length === 0
          && state.sujets.every(s => !s.dateDerniereRevision)
        }
        dispatch={dispatch}
      />
      {((onboardingActive && state.settings.onboarding.statut === "en_cours")
        || (state.settings.onboarding.statut === "termine" && !state.settings.onboarding.completionAcknowledged)) && (
        <OnboardingModal
          state={state}
          dispatch={dispatch}
          onPause={() => setOnboardingActive(false)}
        />
      )}
    </div>
  );
}
