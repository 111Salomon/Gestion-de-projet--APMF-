import { Layout } from '../../components/layout/Layout';
import { Info, FileText, LifeBuoy, Shield, InfinityIcon, NotebookIcon, NotepadTextIcon, Paperclip, NutOffIcon, ImportIcon, CopyIcon, BadgeInfo, LucideInfo } from 'lucide-react';

const APP_VERSION = 'v1.0.0';
const DOC_URL = 'https://docs.taskflow.app';

export const Settings = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-100">
          <header className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3">
            <Info className="w-5 h-5 text-orange-500" />
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">À propos & Support</h1>
              <p className="text-sm text-neutral-500">Informations utiles et ressources d'aide.</p>
            </div>
          </header>

          <div className="divide-y divide-neutral-100">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-700">Version de l'application</p>
                <p className="text-xs text-neutral-500">Mise à jour automatiquement à chaque déploiement.</p>
              </div>
              <span className="text-sm font-mono bg-neutral-100 text-neutral-700 px-3 py-1 rounded-lg border border-neutral-200">
                {APP_VERSION}
              </span>
            </div>

            <a
              href={DOC_URL}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-5 flex items-center justify-between hover:bg-neutral-50 transition"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Documentation</p>
                  <p className="text-xs text-neutral-500">Consultez le guide utilisateur complet.</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase text-orange-500">Ouvrir →</span>
            </a>

         


              <div className="p-4  border-neutral-10">
                <div className="flex items-center gap-3  ml-2.5">
                  <LucideInfo className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-semibold text-neutral-800">Informations</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-3 ml-11 ">
                  Application web de gestion de projet et tâche
                  <br />sandriatinaina@gmail.com
                <br />&copy; 2025 <em className='text-orange-500'>ANDRIATINIAINA Salomon</em>. Tout droit réservé
                </p>
              </div>
          
          </div>
        </section>
      </div>
    </Layout>
  );
};
