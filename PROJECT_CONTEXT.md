# Client OAuth créé
id_client
223715648574-ngqdssmqr58tvqdfc99ghn1jvbd37k2f.apps.googleusercontent.com

code_secret_du_client
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

# Projet : Application de Gestion de Projets et Tâches



_Dernière mise à jour : 04 fév. 2026_

## 1. Stack technique & versions
- **Backend** : Python 3.10.10, Django 5.2.8, Django REST Framework 3.16, SimpleJWT, PostgreSQL 17, psycopg2, django-filter, CORS headers, django-extensions.
- **Frontend** : React 19 + Vite 7, TailwindCSS 3.4, Axios, react-router-dom 7, lucide-react, dnd-kit, recharts, react-hot-toast, date-fns.
- **Outils dev** : ESLint 9, Black, Pytest, pytest-django.
- **Authentification** : JWT (access 60 min, refresh 7 jours) + backend email-only (`EmailAuthenticationBackend`).

## 2. Architecture fonctionnelle
### Backend (`backend/`)
- **apps/users** : modèle utilisateur personnalisé (connexion email, rôles, équipe), gestion des invitations, exports CSV/Excel/PDF, endpoints profil & équipe.
- **apps/projects** : CRUD projets, analytique avancée (`analytics.py`, `permissions_analytics.py`), KPIs top projets.
- **apps/tasks** : CRUD tâches, commentaires, pièces jointes, endpoints spécifiques Kanban (`change-status`, `update-order`), sérialiseurs optimisés (`TaskListSerializer`).
- **apps/notifications** : modèles/signaux pour suivre activités & notifications temps réel.
- **apps/calendar** : endpoints calendrier & plages de disponibilité.
- **config/** : paramètres environnement (.env via `python-decouple`), CORS, REST_FRAMEWORK (pagination `page_size` dynamique), configuration email SMTP Gmail, chemins médias.

### Frontend (`frontend/`)
- **Layout commun** (`components/layout`) avec Navbar/Sidebar, badges dynamiques via `StatsContext`.
- **Pages principales** : `Dashboard`, `Projects`, `Tasks`, `Kanban`, `Team`, `Reports` (analytics), `Calendar`, `Settings`, `Auth/Login`.
- **Contexts** : `AuthContext` (JWT + events `subscribe`), `StatsContext` (compteurs globales rafraîchis après actions).
- **APIs** (`src/api/`) : modules par domaine (auth, tasks, projects, dashboard, notifications, attachments, team, reports) basés sur `axiosInstance` (intercepteurs token + `MEDIA_URL`).
- **Drag & Drop Kanban** : `@dnd-kit` + endpoints `tasksAPI.changeStatus / updateStatusKanban`.

## 3. Structure de fichiers (arborescence principale)
```
Gestion de projet/
├── PROJECT_CONTEXT.md
├── VERSION.md
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── apps/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── notifications/
│   │   └── calendar/
│   ├── media/
│   └── venv/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── index.css
│   └── node_modules/
└── desktop.ini
```
- `backend/apps/{users,projects,tasks,notifications,calendar}/` : logique métier modulaire et endpoints REST correspondants.
- `backend/config/settings.py` : configuration CORS, JWT, DB, email, médias, timezone `Indian/Antananarivo`.
- `backend/requirements.txt` : dépendances exactes du serveur (voir aussi `VERSION.md`).
- `frontend/src/` :
  - `pages/` (auth, dashboard, kanban, team, reports, tasks, projects, settings, calendar).
  - `components/` (common UI, dashboard widgets, kanban, forms, notifications, team modals, tasks attachments/comments).
  - `api/` (axios wrappers), `context/` (auth & stats), `utils/validators.js`, `index.css` (design system Tailwind).

## 4. Configuration & variables d’environnement
Créer `backend/.env` (exemple) :
```
SECRET_KEY=...
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=gestion_projet
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
EMAIL_HOST_USER=odcfigma@gmail.com
EMAIL_HOST_PASSWORD=<app-password>
```
Autres points :
- `CORS_ALLOWED_ORIGINS` → `http://localhost:5173` (Vite) + ajouter les domaines de prod au besoin.
- `MEDIA_ROOT=backend/media`, upload pièces jointes sous `uploads/tasks/%Y/%m/`.
- Ports par défaut : Django 8000 (API), Vite 5173 (frontend). `FRONTEND_URL` utilisé dans emails.

## 5. Instructions d’exécution
### Backend
1. `cd backend`
2. (Optionnel) `py -3.10 -m venv venv && venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `python manage.py migrate`
5. `python manage.py createsuperuser` (si nécessaire)
6. `python manage.py runserver 0.0.0.0:8000`

Tests : `pytest` ou `python manage.py test`. Outils lint/format : `black`, `flake8`.

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Vite) ou `npm run build && npm run preview`

Configurer `VITE_API_URL` si besoin (sinon défaut `http://localhost:8000`).

## 6. État fonctionnel (04 fév. 2026)
### ✅ Fonctionnalités disponibles
1. Authentification JWT complète (login/email, refresh, logout).
2. Dashboard riche : KPIs, donut chart, top projets, activités récentes, alertes tâches urgentes.
3. CRUD Projets & Tâches + recherche/filtre + pièces jointes + commentaires.
4. Vue Kanban drag & drop (statuts `todo/in_progress/in_review/done`, filtrage par projet, mise à jour optimiste + refresh stats).
5. Gestion d’équipe : listing, filtres, modals profil/invitation/ajout, export CSV/Excel/PDF, rôles.
6. Notifications & RecentActivity (backend signals + composants `NotificationBell/Dropdown`).
7. Analytics/Rapports : tendances productivité (Recharts), classements équipe, filtres période, export.
8. Paramètres & informations support (`Settings.jsx`).
9. API Calendar & pages associées (synchronisation planning).



## 6. Endpoints & URLs clés
- Base API : `http://127.0.0.1:8000/api/`
  - Auth JWT : `/token/`, `/token/refresh/` (vue DRF SimpleJWT)
  - Users/équipe : `/users/…` (`views_team.py`, exports `/team-members/export/{csv|excel|pdf}/`)
  - Projects : `/projects/`
  - Tasks : `/tasks/`, `/tasks/<id>/change-status/`, `/tasks/<id>/update-order/`, `/tasks/<id>/comments/`
  - Notifications : `/notifications/`
  - Calendar : `/calendar/`
- Frontend : `http://localhost:5173`

## 7. Notes & bonnes pratiques
- `TaskListSerializer` = payload léger pour listes, `TaskSerializer` = détail complet (relations). Utiliser le sérialiseur adapté côté vues.
- `StatsContext` recharge automatiquement après actions (create/update/delete) — éviter les doubles appels API côté composants.
- Lors d’un drag & drop Kanban, `tasksAPI.changeStatus` est utilisé pour les transitions simples ; `updateStatusKanban` gère statut + ordre.
- Export équipe (`Team.jsx`) : nécessite token JWT stocké dans `localStorage`; penser à autoriser `content-disposition` dans CORS si déployé.
- Pour les uploads >2 MB ajuster `FILE_UPLOAD_MAX_MEMORY_SIZE` / `DATA_UPLOAD_MAX_MEMORY_SIZE`.
- TIME_ZONE fixé à `Indian/Antananarivo` → toujours convertir côté frontend (`toLocaleDateString('fr-FR')`).

## 8. Historique rapide
- Correctifs badges sidebar (StatsContext) & TaskCard (suppression `onStatusChange`).
- Ajout champs `project_name` / `assigned_to_name` dans `TaskListSerializer` pour éviter IDs bruts.
- Réécriture complète des pages Team & Reports avec UI senior (animations, exports, analytics).

Ce document sert de _single source of truth_ pour briefer un agent IA : fournir ce contexte + les fichiers actifs (ex. composant ou vue concernée) pour obtenir des réponses pertinentes.
