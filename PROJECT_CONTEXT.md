# Projet : Application de Gestion de Projets et Tâches

## Stack Technique
- **Backend** : Django 5.1, Django REST Framework, JWT Auth
- **Frontend** : React 18, Vite, TailwindCSS, Axios
- **Base de données** : PostgreSQL

## Structure du Projet

## frontend
frontend/
├── public/
│   └── vite.svg
│
├── src/
│   ├── api/
│   │   ├── auth.js
│   │   ├── axios.js
│   │   ├── projects.js
│   │   └── tasks.js
│   │
│   ├── assets/
│   │   └── img/
│   │       ├── APMF Logo.png
│   │       ├── rightSide.jpg
│   │       └── react.svg
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── RecentActivity.jsx
│   │   │   └── StatCard.jsx
│   │   │
│   │   ├── forms/
│   │   │   ├── ProjectForm.jsx
│   │   │   └── TaskForm.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   └── tasks/
│   │       └── TaskCard.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── StatsContext.jsx
│   │
│   ├── hooks/
│   │   └── useForm.js
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── projects/
│   │   │   └── Projects.jsx
│   │   └── tasks/
│   │       └── Tasks.jsx
│   │
│   ├── utils/
│   │   └── validators.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js


## backend
backend/
├── apps/
│   ├── __init__.py
│   ├── projects/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   └── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   └── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   └── users/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── authentication.py
│       ├── migrations/
│       │   ├── 0001_initial.py
│       │   └── __init__.py
│       ├── models.py
│       ├── permissions.py
│       ├── serializers.py
│       ├── tests.py
│       ├── urls.py
│       └── views.py
│
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── manage.py
├── requirements.txt
└── venv/




## État Actuel (14 Nov 2025)

### ✅ Fonctionnalités Complètes
- Authentification JWT (login, logout, refresh token)
- Dashboard avec statistiques
- CRUD Projets (créer, lire, modifier, supprimer)
- CRUD Tâches (créer, lire, modifier, supprimer)
- Badges dynamiques dans sidebar
- Filtres et recherche de tâches
- Responsive design

### ⏳ En Cours / À Faire
- Board Kanban (tentative échouée, à réessayer)
- Gestion de l'équipe
- Profil utilisateur
- Graphiques sur le dashboard

## Problèmes Résolus Récemment
1. ✅ Badges affichant "6" et "1" au lieu des noms → Ajout de `project_name` et `assigned_to_name` dans TaskListSerializer
2. ✅ TaskCard avec badge cliquable → Retiré `onStatusChange`
3. ✅ Badges sidebar à 0 après login → Corrigé StatsContext

## Configuration Importante

### URLs Backend
- API Base: `http://127.0.0.1:8000/api/`
- Auth: `/auth/login/`, `/auth/logout/`, `/auth/refresh/`
- Projects: `/projects/`
- Tasks: `/tasks/`

### Ports
- Django: 8000
- React: 5173

## Notes Importantes
- Utilise `TaskListSerializer` pour la liste (léger)
- Utilise `TaskSerializer` pour les détails (complet avec relations)
- StatsContext charge les stats au montage ET après chaque action

