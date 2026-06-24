# Clinica

Système de gestion de caisse hospitalière — Hôpital Saint Jean, Bénin.  
Hackathon MTN Bénin × Ministère de la Santé — Juin 2026.

**Stack :** React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + Framer Motion

## Lancer le projet en local

```bash
cd app          # ← IMPORTANT : toujours depuis app/, pas la racine
npm install
npm run dev
# → http://localhost:5173
```

## Déploiement Vercel

Le build Vercel utilise le `package.json` racine qui délègue vers `app/` :
```
npm --prefix app install && npm --prefix app run build
```
Output : `app/dist/`

## Comptes de démo

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Caissier | amadou.k | 1234 |
| Superviseur | marie.d | 1234 |
| Accueil | jean.a | 1234 |
