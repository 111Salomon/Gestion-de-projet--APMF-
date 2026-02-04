import sys
import django
import pkg_resources

print("=" * 50)
print("📦 VERSIONS DES TECHNOLOGIES - BACKEND")
print("=" * 50)

# Python
print(f"\n🐍 Python: {sys.version.split()[0]}")

# Django
print(f"🎯 Django: {django.get_version()}")

# Toutes les dépendances installées
print("\n📚 Packages installés:")
installed_packages = [d for d in pkg_resources.working_set]
for package in sorted(installed_packages, key=lambda x: str(x).lower()):
    print(f"  - {package}")

# Pour lancer ce fichier : python check_versions.py