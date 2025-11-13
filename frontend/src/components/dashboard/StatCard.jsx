/**
 * Carte de statistique avec icône et évolution
 * Affiche un KPI avec son évolution en pourcentage
 */
export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'primary' 
}) => {
  const isPositive = trend >= 0;
  
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 mb-2">{value}</h3>
          
          <div className="flex items-center gap-1">
            <span className={`text-sm font-semibold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            <span className="text-sm text-neutral-500">vs mois dernier</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
