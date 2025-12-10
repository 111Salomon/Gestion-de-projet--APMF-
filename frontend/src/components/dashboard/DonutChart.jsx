import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';
import { useState } from 'react';

// 🎨 Palette sobre et élégante
const COLORS = {
  todo: {
    main: '#94A3B8',
    light: '#F1F5F9'
  },
  in_progress: {
    main: '#F59E0B',
    light: '#FEF3C7'
  },
  in_review: {
    main: '#3B82F6',
    light: '#DBEAFE'
  },
  done: {
    main: '#10B981',
    light: '#D1FAE5'
  },
};

const LABELS = {
  todo: 'À faire',
  in_progress: 'En cours',
  in_review: 'En révision',
  done: 'Terminé',
};

const ICONS = {
  todo: Circle,
  in_progress: Clock,
  in_review: AlertCircle,
  done: CheckCircle,
};

export const DonutChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // 📊 Transformer les données
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key],
    value: value,
    key: key,
    color: COLORS[key].main,
  })).filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <Activity className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Aucune tâche disponible</p>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // 💬 Tooltip simple et élégant
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-neutral-100">
          <p className="text-xs font-medium text-neutral-500 mb-1">{data.name}</p>
          <p className="text-2xl font-bold text-neutral-900">{data.value}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* 📈 Graphique donut épuré */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={activeIndex !== null ? 98 : 95}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.key].main}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                    filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* 📊 Centre minimaliste */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-5xl font-bold text-neutral-900 mb-1">
            {total}
          </p>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Tâches
          </p>
        </div>
      </div>

      {/* 🎴 Cards minimalistes avec animations subtiles */}
      <div className="grid grid-cols-2 gap-3">
        {chartData.map((entry, index) => {
          const Icon = ICONS[entry.key];
          const percentage = ((entry.value / total) * 100).toFixed(1);
          const isActive = activeIndex === index;
          
          return (
            <div
              key={entry.key}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`
                relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
                ${isActive 
                  ? 'bg-white shadow-lg border-neutral-200 -translate-y-1' 
                  : 'bg-white shadow-sm border-neutral-100 hover:shadow-md hover:border-neutral-200'
                }
              `}
              style={{
                animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`
              }}
            >
              {/* 🎨 Accent de couleur élégant */}
              <div 
                className="absolute top-0 left-0 w-1 h-full rounded-l-xl transition-all duration-300"
                style={{ 
                  backgroundColor: COLORS[entry.key].main,
                  opacity: isActive ? 1 : 0.5,
                  width: isActive ? '3px' : '2px'
                }}
              />

              <div className="flex items-center gap-3 ml-1">
                {/* 💎 Icône simple et clean */}
                <div 
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all duration-300
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                  style={{ 
                    backgroundColor: COLORS[entry.key].light
                  }}
                >
                  <Icon 
                    className="w-5 h-5 transition-transform duration-300"
                    style={{ 
                      color: COLORS[entry.key].main,
                      transform: isActive ? 'rotate(5deg)' : 'rotate(0deg)'
                    }}
                  />
                </div>

                {/* 📝 Contenu épuré */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-500 mb-1.5 truncate">
                    {entry.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-neutral-900">
                      {entry.value}
                    </span>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: COLORS[entry.key].main }}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 📊 Mini barre de progression discrète */}
              <div className="mt-3 h-1 bg-neutral-50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: COLORS[entry.key].main
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 🎯 Résumé simple et efficace */}
      <div 
        className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow duration-300"
        style={{ animation: 'fadeInUp 0.4s ease-out 0.32s both' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: COLORS.done.light }}
          >
            <CheckCircle 
              className="w-5 h-5" 
              style={{ color: COLORS.done.main }} 
            />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">
              Complétées
            </p>
            <p className="text-2xl font-bold text-neutral-900">
              {data.done || 0}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-neutral-400 mb-1">
            Progression
          </p>
          <p 
            className="text-2xl font-bold"
            style={{ color: COLORS.done.main }}
          >
            {total > 0 ? ((data.done / total) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* 🎨 CSS Animations simples */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
