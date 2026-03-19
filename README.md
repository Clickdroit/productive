# 🚀 Productive — Dashboard Productivité

Dashboard productivité tout-en-un avec 5 widgets : **Tâches**, **Notes**, **Pomodoro**, **Habitudes**, **Journal**.
Inclut aussi une **vue Accueil** et un **mode focus** centré sur le Pomodoro.

## Stack

| Couche   | Tech                          |
|----------|-------------------------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend  | Node.js + Express             |
| BDD      | PostgreSQL + Prisma ORM       |
| Auth     | JWT (Bearer tokens)           |
| Deploy   | Docker + docker-compose       |

## Lancement rapide

### Avec Docker (recommandé)

```bash
# Cloner et démarrer
git clone <repo-url> productive
cd productive

# (Optionnel) Configurer le secret JWT
export JWT_SECRET="mon-secret-super-fort"

# Lancer
docker compose up --build -d

# Le dashboard est accessible sur http://localhost
# L'API backend est sur le port 3003, préfixe /prod/api/
```

### Développement local

```bash
# 1. Lancer PostgreSQL (ex: Docker ou local)
docker run -d --name productive-db \
  -e POSTGRES_USER=productive \
  -e POSTGRES_PASSWORD=productive \
  -e POSTGRES_DB=productive \
  -p 5432:5432 postgres:16-alpine

# 2. Backend
cd backend
cp ../.env.example .env  # Adapter si besoin
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## API Endpoints

Toutes les routes sont préfixées par `/prod/api`.

| Méthode | Route                        | Description               |
|---------|------------------------------|---------------------------|
| POST    | `/prod/api/auth/register`    | Inscription               |
| POST    | `/prod/api/auth/login`       | Connexion                 |
| GET     | `/prod/api/auth/me`          | Utilisateur courant       |
| GET/POST/PUT/DELETE | `/prod/api/todos`  | CRUD Tâches              |
| POST    | `/prod/api/todos/reorder`     | Réordonner les tâches     |
| GET/POST/PUT/DELETE | `/prod/api/notes`  | CRUD Notes               |
| GET/POST/PATCH/DELETE | `/prod/api/pomodoro` | Sessions Pomodoro    |
| GET     | `/prod/api/pomodoro/stats`   | Statistiques Pomodoro     |
| GET     | `/prod/api/pomodoro/productivity` | Productivité jour/semaine |
| GET/POST/PUT/DELETE | `/prod/api/habits` | CRUD Habitudes           |
| POST    | `/prod/api/habits/:id/toggle`| Toggle completion jour    |
| GET     | `/prod/api/habits/stats/summary` | Stats habitudes (30/90j, streaks) |
| GET/POST/DELETE | `/prod/api/journal`    | Entrées journal          |
| GET     | `/prod/api/journal/date/:d`  | Entrée par date          |
| GET     | `/prod/api/journal/stats/mood` | Statistiques d'humeur    |

## Fonctions principales

- **Tâches**: checklist/sous-tâches, description markdown, échéance avec alerte visuelle, tags, drag & drop pour l’ordre.
- **Notes**: dossiers/catégories, tags, recherche full-text côté API, épinglage, export markdown/PDF (impression navigateur).
- **Pomodoro**: durées personnalisables, session liée à une tâche, graphe de productivité, son + notification navigateur en fin de session.
- **Habitudes**: streak 🔥, objectif hebdomadaire configurable, taux de complétion 30/90 jours, rappel activable.
- **Journal**: templates matin/soir, recherche globale, stats d’humeur mensuelles, export markdown de toutes les entrées.
- **Global**: vue d’accueil résumée, mode focus, thèmes de couleur, notifications navigateur, raccourcis clavier.

## Raccourcis clavier (Dashboard)

- `1..6`: naviguer entre Accueil / widgets
- `f`: activer/désactiver le mode focus

## Structure

```
productive/
├── frontend/           # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/ # TodoWidget, NotesWidget, PomodoroWidget, HabitWidget, JournalWidget
│   │   ├── context/    # AuthContext
│   │   ├── pages/      # LoginPage, RegisterPage, DashboardPage
│   │   └── lib/        # api.js (Axios)
│   ├── Dockerfile
│   └── nginx.conf
├── backend/            # Express + Prisma
│   ├── src/
│   │   ├── routes/     # auth, todos, notes, pomodoro, habits, journal
│   │   └── middleware/ # auth.js (JWT)
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
