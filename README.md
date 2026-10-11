# Projet_textile001

**JO Management — Gestion intégrée de l'entreprise textile**

Application web de gestion pour entreprise textile (coupe, couture, contrôle qualité, retouche, stock, magasinier, sécurité), développée avec :

- Next.js 15 (App Router) + React 19 + TypeScript
- Material UI v7 + Tailwind CSS 4
- SQLite (better-sqlite3), accessible uniquement côté serveur

## Installation

```bash
npm install
npm run build
npm start
```

Le serveur démarre sur le port 3000. Les migrations de base de données s'appliquent automatiquement au premier accès.

## Scripts utiles

| Commande | Description |
|---|---|
| `npm run dev` | Développement |
| `npm run build` | Build de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `node scripts/check-line-limit.mjs` | Audit limite 400 lignes/fichier |
| `npm run test:coupe` | Tests module coupe (idem : couture, cq, retouche, stock, magasinier, securite, admin, auth, config) |
