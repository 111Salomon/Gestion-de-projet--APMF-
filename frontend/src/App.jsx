import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StatsProvider } from './context/StatsContext';
import { NotificationProvider } from './context/NotificationContext';  // ✅ AJOUTÉ
import { ChatProvider } from './context/ChatContext';  // ✨ AJOUTÉ
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Projects } from './pages/projects/Projects';
import { Tasks } from './pages/tasks/Tasks';
import { TaskDetail } from './pages/tasks/TaskDetail'; 
import { Kanban } from './pages/kanban/Kanban';
import { ProjectDetail } from './pages/projects/ProjectDetail';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Team } from './pages/team/Team';  
import { ResetPassword } from './pages/auth/ResetPassword';
import { Analytics } from './pages/reports/Reports'; 
import { ProjectAnalytics } from './pages/projects/ProjectAnalytics';
import { Calendar } from './pages/calendar/Calendar';
import { Settings } from './pages/settings/Settings';
import { ChatPage } from './pages/chat/ChatPage';

/**
 * Composant pour protéger les routes privées
 * Redirige vers /login si l'utilisateur n'est pas connecté
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Affiche un spinner pendant la vérification de l'auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirige vers login si pas authentifié
  return user ? children : <Navigate to="/login" replace />;
};



/**
 * 🔒 Composant de protection pour les routes Admin/Chef de Projet
 */
const AdminOrManagerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Affiche un spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Vérifie si l'utilisateur a le bon rôle
  const isAuthorized = user?.role === 'admin' || user?.role === 'chef';

  // Si pas autorisé, affiche un message d'erreur
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès Refusé</h1>
            <p className="text-gray-600 mb-6">
              Cette section est réservée aux <strong>administrateurs</strong> et <strong>chefs de projet</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Si vous pensez que c'est une erreur, contactez votre administrateur.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            ← Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Si autorisé, affiche le contenu
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StatsProvider>
          <NotificationProvider>  {/* ✅ AJOUTÉ ICI */}
            <ChatProvider>
            <Routes>
              {/* Route publique */}
              <Route path="/login" element={<Login />} />
              <Route path="reset-password" element={<ResetPassword />} />

              
              {/* Routes protégées */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* 🔒 Analytics Globales - PROTÉGÉ : Admin + Chef de Projet uniquement */}
              <Route path="/analytics"
                element={
                  <PrivateRoute>
                    <AdminOrManagerRoute>  {/* 🆕 Protection supplémentaire */}
                      <Analytics />
                    </AdminOrManagerRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <Projects />
                  </PrivateRoute>
                }
              />

              {/* Analytics d'un projet spécifique */}
              <Route path="/projects/:id/analytics" element={
                <PrivateRoute>
                  <ProjectAnalytics />
                </PrivateRoute>
              } />


              <Route 
                path="/projects/:id" 
                element={
                  <PrivateRoute>
                    <ProjectDetail />
                  </PrivateRoute>
                } 
              />

              <Route
                path="/tasks"
                element={
                  <PrivateRoute>
                    <Tasks />
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />

              <Route
                path="/tasks/:id"
                element={
                  <PrivateRoute>
                    <TaskDetail />
                  </PrivateRoute>
                }
              />

              <Route 
                path="/kanban" 
                element={
                  <PrivateRoute>
                    <Kanban />
                  </PrivateRoute>
                } 
              />

              {/* ✅ NOUVEAU : Route Team */}
              <Route 
                path="/team" 
                element={
                  <PrivateRoute>
                    <Team />
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/calendar" 
                element={
                  <PrivateRoute>
                    <Calendar />
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/chat" 
                element={
                  <PrivateRoute>  {/* ✨ AJOUTÉ */}
                      <ChatPage />
                  </PrivateRoute>
                } 
              />

              {/* <Route 
                path="/reset-password" 
                element={
                  <PrivateRoute>
                    <ResetPassword />
                  </PrivateRoute>
                } 
              /> */}


              {/* Redirection par défaut */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Route 404 */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-neutral-900 mb-2">404</h1>
                      <p className="text-neutral-600">Page non trouvée</p>
                    </div>
                  </div>
                } 
              />
            </Routes>
            
            {/* Notifications Toast */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#1a202c',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#059669',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fff',
                  },
                },
              }}
            />
            </ChatProvider>
          </NotificationProvider>  {/* ✅ AJOUTÉ ICI */}
        </StatsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
