import { useNavigate } from 'react-router-dom';
import { ChevronRight, FolderKanban } from 'lucide-react'; // ✅ IMPORT AJOUTÉ

export const ProjectProgressBar = ({ projects }) => {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
        <FolderKanban className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Aucun projet actif</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {projects.map((project) => (
        <div 
          key={project.id} 
          onClick={() => navigate(`/projects/${project.id}`)}
          className="group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neutral-900 group-hover:text-orange-600 transition-colors">
              {project.name}
            </span>
            <span className="text-sm font-bold text-neutral-600">
              {project.progress}%
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {project.done_tasks} / {project.total_tasks} tâches
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      ))}
    </div>
  );
};
