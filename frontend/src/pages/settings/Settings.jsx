import { Layout } from '../../components/layout/Layout';
import { Info, FileText, LifeBuoy, Shield } from 'lucide-react';

const APP_VERSION = 'v1.0.0';
const DOC_URL = 'https://docs.taskflow.app';
const SUPPORT_EMAIL = 'support@taskflow.app';
const FAQ_URL = 'https://support.taskflow.app/faq';
const TERMS_URL = 'https://taskflow.app/terms';
const PRIVACY_URL = 'https://taskflow.app/privacy';

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

            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-3 mb-3">
                  <LifeBuoy className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-semibold text-neutral-800">Support</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-3">
                  Besoin d'aide ? Contactez notre équipe support ou consultez la FAQ.
                </p>
                <div className="flex flex-col gap-1 text-sm">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-orange-600 font-medium hover:underline">{SUPPORT_EMAIL}</a>
                  <a href={FAQ_URL} target="_blank" rel="noreferrer" className="text-neutral-600 hover:text-neutral-800">Accéder à la FAQ →</a>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-semibold text-neutral-800">Conditions & Confidentialité</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-3">
                  Consultez nos engagements en matière de protection des données et d'utilisation.
                </p>
                <div className="flex flex-col gap-1 text-sm">
                  <a href={TERMS_URL} target="_blank" rel="noreferrer" className="text-neutral-600 hover:text-neutral-800">Conditions d'utilisation →</a>
                  <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="text-neutral-600 hover:text-neutral-800">Politique de confidentialité →</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};
