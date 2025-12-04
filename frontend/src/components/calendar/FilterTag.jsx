import { X } from 'lucide-react';

export const FilterTag = ({ label, icon: Icon, onRemove, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-700 border-primary-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        text-sm font-medium border
        ${colorClasses[color]}
        transition-all hover:brightness-95 shadow-sm
      `}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-white/50 rounded-full p-0.5 transition-colors ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
};
