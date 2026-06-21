Guide des icônes pour le raccourci

- Emplacement recommandé : `assets/icons/`
- Fichier par défaut : `Logo.ico`

Changer l'icône :

1. Placer votre fichier `.ico` dans `assets/icons/`.
2. Pour recréer le raccourci avec cette icône, exécuter :

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\create_desktop_shortcut.ps1" -IconName "MonIcone.ico"
```

Utiliser un chemin absolu :

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\create_desktop_shortcut.ps1" -IconPath "C:\chemin\vers\monicone.ico"
```

Si vous partez d'une image (`.png`, `.jpg`), convertissez-la en `.ico` (256x256 recommandé). Exemple avec ImageMagick :

```powershell
magick convert image.png -resize 256x256 monicone.ico
```

Le script créera automatiquement `assets/icons/` s'il n'existe pas.
