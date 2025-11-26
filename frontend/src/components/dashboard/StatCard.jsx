/**
 * 📊 Carte de statistique (KPI)
 */
export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
  // Couleurs selon le type
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Texte */}
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icône */}
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
