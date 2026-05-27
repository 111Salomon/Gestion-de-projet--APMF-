# Synchronisation automatique des archivages (RG-29)

Objectif
-------
Fournir une méthode simple pour exécuter régulièrement la commande Django `sync_project_archives` qui archive/désarchive les projets en fonction de l'état de leurs tâches.

Installation rapide (Windows)
----------------------------
1. Ouvrez PowerShell en tant qu'administrateur (recommandé).
2. Depuis la racine du repo, lancez :

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\register_sync_task.ps1
```

Ce script crée une tâche planifiée Windows nommée `SyncProjectArchives` qui exécutera :

```
<project>/backend/venv/Scripts/python.exe <project>/backend/manage.py sync_project_archives
```

La tâche démarre dans 1 minute et se répète toutes les 60 minutes.

Manuel
------
Vous pouvez lancer manuellement la commande depuis `backend` avec le virtualenv activé :

```powershell
cd backend
venv\Scripts\activate
python manage.py sync_project_archives
```

Annuler la tâche planifiée
-------------------------
Pour supprimer la tâche sous Windows :

```powershell
Unregister-ScheduledTask -TaskName "SyncProjectArchives" -Confirm:$false
```

Notes
-----
- Le script suppose l'existence d'un virtualenv dans `backend/venv`.
- Si vous préférez une solution basée sur `celery`/`beat`, je peux ajouter une configuration alternative.
