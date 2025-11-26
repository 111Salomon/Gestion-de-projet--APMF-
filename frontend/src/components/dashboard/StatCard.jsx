// /**
//  * 📊 Carte de statistique (KPI)
//  */
// export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
//   // Couleurs selon le type
//   const colorClasses = {
//     primary: 'bg-blue-100 text-blue-600',
//     success: 'bg-green-100 text-green-600',
//     warning: 'bg-amber-100 text-amber-600',
//     error: 'bg-red-100 text-red-600',
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between">
//         {/* Texte */}
//         <div className="flex-1">
//           <p className="text-sm font-medium text-neutral-600 mb-1">
//             {title}
//           </p>
//           <p className="text-3xl font-bold text-neutral-900 mb-1">
//             {value}
//           </p>
//           {subtitle && (
//             <p className="text-xs text-neutral-500">
//               {subtitle}
//             </p>
//           )}
//         </div>

//         {/* Icône */}
//         {Icon && (
//           <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
//             <Icon className="w-6 h-6" />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// frontend/src/components/dashboard/StatCard.jsx

export const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colors = {
    primary: 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 border-blue-200 hover:border-blue-400',
    success: 'bg-green-100 text-green-600 group-hover:bg-green-500 border-green-200 hover:border-green-400',
    warning: 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 border-amber-200 hover:border-amber-400',
    error: 'bg-red-100 text-red-600 group-hover:bg-red-500 border-red-200 hover:border-red-400'
  };

  const colorClass = colors[color] || colors.primary;

  return (
    <div className={`group bg-white border-2 ${colorClass} rounded-xl p-6 transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colorClass}`}>
          <Icon className="w-6 h-6 group-hover:text-white transition-colors" />
        </div>
      </div>
      <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-neutral-900 mb-1">{value}</p>
      <p className="text-sm text-neutral-500">{subtitle}</p>
    </div>
  );
};
