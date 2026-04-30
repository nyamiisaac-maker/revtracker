# RevTracker — Préparation PEBC

## Contexte
Tracker personnel pour ma préparation au PEBC Pharmacist Evaluating Examination.
Examen prévu le 15 octobre 2026.

## Stack technique
- React 18 + Vite + Tailwind CSS
- Recharts pour les graphiques
- Lucide-react pour les icônes
- Lodash pour les utilitaires
- Persistence : window.storage avec fallback localStorage

## Architecture
- Fichier unique src/App.jsx (~2570 lignes, monolithique volontaire)
- 168 sujets PEBC pré-chargés selon le blueprint officiel 2025
- 9 vues : Dashboard, Plan 26 semaines, Sujets, Flashcards, Planning,
  Sessions, Statistiques, Insights, Paramètres
- 3 modules clés du plan v3 : semainePlan sur sujets, vue Plan, Checkpoints S4/S10/S16

## Workflow de modification
1. Modification dans src/App.jsx
2. npm run build pour vérifier la compilation
3. git add -A && git commit -m "..." && git push
4. Vercel redéploie automatiquement (1-2 min)

## Conventions
- Pas de bibliothèque additionnelle sans demander
- Garder le fichier App.jsx monolithique (pas de découpage en modules)
- Conserver les commentaires et libellés en français
- Source officielle unique : pebc.ca
- Aucune référence à des cours/QBank commerciaux

## Pour les modifications
- Toujours faire un test de build avant de pousser
- Petits commits ciblés (un changement = un commit)
- Messages de commit en français, descriptifs
