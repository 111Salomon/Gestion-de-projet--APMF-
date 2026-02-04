import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { 
  Info, 
  FileText, 
  LifeBuoy, 
  Shield, 
  InfinityIcon, 
  NotebookIcon, 
  NotepadTextIcon, 
  Paperclip, 
  NutOffIcon, 
  ImportIcon, 
  CopyIcon, 
  BadgeInfo, 
  LucideInfo,
  Calendar as CalendarIcon,
  Link2,
  Unlink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { googleCalendarAPI } from '../../api/googleCalendar';
import toast from 'react-hot-toast';

const APP_VERSION = 'v1.0.0';
const DOC_URL = 'https://docs.taskflow.app  ';

export const Settings = () => {
  // ✨ États pour Google Calendar Integration
  const { user, connectGoogleCalendar, disconnectGoogleCalendar } = useAuth();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

// Remplacez le useEffect existant par celui-ci (vers ligne 40)
// ✨ Vérifier la connexion Google au chargement + détecter query params
useEffect(() => {
  // Détecter google_connected dans les query params
  const urlParams = new URLSearchParams(window.location.search);
  const googleConnectedParam = urlParams.get('google_connected');
  
  if (googleConnectedParam === 'true') {
    // Nettoyer l'URL (enlever les params après traitement)
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // Forcer un rafraîchissement immédiat pour détecter la nouvelle connexion
    setTimeout(() => {
      checkGoogleConnection();
    }, 500);
  } else {
    // Vérification normale au chargement
    checkGoogleConnection();
  }
}, []); // Toujours [] pour éviter les boucles infinies

const checkGoogleConnection = async () => {
  try {
    const data = await googleCalendarAPI.getCalendars();
    
    if (!data.calendars || data.calendars.length === 0) {
      console.warn('⚠️ Aucun calendrier retourné par l\'API');
      setGoogleConnected(false);
      return;
    }
    
    setGoogleConnected(true);
    setGoogleCalendars(data.calendars);
    
    // Sélectionner le calendrier primaire ou le premier
    const primary = data.calendars.find(cal => cal.primary);
    const calendarToSelect = primary || data.calendars[0];
    
    if (calendarToSelect) {
      console.log('✅ Calendrier sélectionné automatiquement:', calendarToSelect);
      
      // ✨ NOUVEAU : Sauvegarder le calendrier dans la base de données
      try {
        await googleCalendarAPI.selectCalendar(calendarToSelect.id);
        console.log('✅ Calendrier sauvegardé dans la base de données');
      } catch (error) {
        console.error('❌ Erreur sauvegarde calendrier:', error);
        // Continuer quand même, l'utilisateur pourra sélectionner manuellement
      }
      
      setSelectedCalendar(calendarToSelect.id);
    } else {
      console.warn('⚠️ Aucun calendrier à sélectionner');
      setSelectedCalendar('');
    }
    
  } catch (error) {
    console.error('❌ Erreur checkGoogleConnection:', error);
    
    if (error.response?.data?.error === 'Not connected to Google Calendar') {
      setGoogleConnected(false);
    } else if (error.response?.data?.error === 'token_expired') {
      toast.error('Token Google expiré. Veuillez vous reconnecter.');
      setGoogleConnected(false);
    } else {
      toast.error('Erreur de connexion Google Calendar');
      setGoogleConnected(false);
    }
  }
};

  const handleGoogleConnect = async () => {
    setLoading(true);
    try {
      await connectGoogleCalendar();
      // La redirection se fait dans connectGoogleCalendar
    } catch (error) {
      setLoading(false);
      toast.error('Erreur lors de la connexion à Google Calendar');
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Google Calendar ?')) {
      return;
    }
    
    setLoading(true);
    try {
      await disconnectGoogleCalendar();
      setGoogleConnected(false);
      setGoogleCalendars([]);
      setSelectedCalendar('');
      toast.success('Google Calendar déconnecté avec succès');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

const handleSelectCalendar = async (calendarId) => {
  if (calendarId === selectedCalendar) {
    return; // Déjà sélectionné
  }

  try {
    const result = await googleCalendarAPI.selectCalendar(calendarId);
    setSelectedCalendar(calendarId);
    toast.success(result.message || 'Calendrier sélectionné avec succès');
  } catch (error) {
    console.error('❌ Erreur sélection calendrier:', error);
    if (error.response?.data?.error === 'token_expired') {
      toast.error('Token Google expiré. Veuillez vous reconnecter.');
      setGoogleConnected(false);
    } else {
      toast.error('Erreur lors de la sélection du calendrier');
    }
  }
};

  const handleSyncGoogle = async () => {
    if (!selectedCalendar) {
      toast.error('Veuillez sélectionner un calendrier Google');
      return;
    }

    setSyncing(true);
    try {
      const result = await googleCalendarAPI.syncWithGoogle();
      toast.success(result.message || 'Synchronisation réussie');
    } catch (error) {
      if (error.response?.data?.error === 'token_expired') {
        toast.error('Token Google expiré. Veuillez vous reconnecter.');
        setGoogleConnected(false);
      } else {
        toast.error('Erreur lors de la synchronisation');
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GOOGLE CALENDAR INTEGRATION SECTION */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-100">
          <header className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-orange-500" />
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Google Calendar</h1>
              <p className="text-sm text-neutral-500">Synchronisez vos tâches avec Google Calendar</p>
            </div>
          </header>

          <div className="divide-y divide-neutral-100">
            {/* Status de connexion */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-700">Statut de la connexion</p>
                  <p className="text-xs text-neutral-500">
                    {googleConnected 
                      ? 'Connecté à Google Calendar' 
                      : 'Non connecté'}
                  </p>
                </div>
                
                {googleConnected ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Connecté
                    </span>
                    <button
                      onClick={handleGoogleDisconnect}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 
                               bg-red-50 hover:bg-red-100 rounded-lg border border-red-200
                               transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4" />
                      )}
                      Déconnecter
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleConnect}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-orange-600 
                             bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200
                             transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    Connecter Google Calendar
                  </button>
                )}
              </div>
            </div>

            {/* Liste des calendriers (si connecté) */}
            {googleConnected && (
              <div className="px-6 py-5">
                <div>
                  <p className="text-sm font-semibold text-neutral-700 mb-2">Calendrier sélectionné</p>
                  <div className="space-y-2">
                    {googleCalendars.map((calendar) => (
                      <button
                        key={calendar.id}
                        onClick={() => handleSelectCalendar(calendar.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border 
                                  transition-all ${
                                    selectedCalendar === calendar.id
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-neutral-200 hover:border-orange-300'
                                  }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            calendar.primary ? 'bg-orange-500' : 'bg-neutral-400'
                          }`} />
                          <span className="text-sm text-neutral-700">{calendar.name}</span>
                          {calendar.primary && (
                            <span className="text-xs font-semibold text-orange-500">Principal</span>
                          )}
                        </div>
                        {selectedCalendar === calendar.id && (
                          <CheckCircle className="w-5 h-5 text-orange-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de synchronisation (si connecté et calendrier sélectionné) */}
            {googleConnected && selectedCalendar && (
              <div className="px-6 py-5 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Synchronisation</p>
                    <p className="text-xs text-neutral-500">
                      Synchronisez vos tâches avec deadline vers Google Calendar
                    </p>
                  </div>
                  <button
                    onClick={handleSyncGoogle}
                    disabled={syncing}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white 
                             bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700
                             rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <InfinityIcon className="w-4 h-4" />
                        Synchroniser maintenant
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Message d'information */}
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Comment ça marche ?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>Connectez votre compte Google Calendar</li>
                    <li>Choisissez le calendrier où synchroniser vos tâches</li>
                    <li>Les tâches avec deadline seront automatiquement ajoutées</li>
                    <li>Synchronisez manuellement ou automatiquement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ABOUT & SUPPORT SECTION (EXISTANT) */}
        {/* ═══════════════════════════════════════════════════════════ */}
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