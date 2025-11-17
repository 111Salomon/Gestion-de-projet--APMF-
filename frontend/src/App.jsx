import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Projects } from './pages/projects/Projects';
import { Tasks } from './pages/tasks/Tasks';
import { TaskDetail } from './pages/tasks/TaskDetail'; 
import { Kanban } from './pages/kanban/Kanban';
import { ProjectDetail } from './pages/projects/ProjectDetail';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { StatsProvider } from './context/StatsContext';



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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StatsProvider>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
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

            <Route 
    path="/projects/:id" 
    element={<PrivateRoute><ProjectDetail /></PrivateRoute>} 
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
        </StatsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
