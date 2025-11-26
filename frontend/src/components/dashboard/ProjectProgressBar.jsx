export const ProjectProgressBar = ({ projects }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-neutral-500 text-center py-8">
        Aucun projet actif
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-900">
              {project.name}
            </span>
            <span className="text-sm text-neutral-600">
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{project.done_tasks} / {project.total_tasks} tâches</span>
          </div>
        </div>
      ))}
    </div>
  );
};
