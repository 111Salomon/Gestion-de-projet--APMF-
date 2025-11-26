import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  todo: '#6B7280',        // Gris
  in_progress: '#3B82F6', // Bleu
  in_review: '#F59E0B',   // Orange
  done: '#10B981',        // Vert
};

const LABELS = {
  todo: 'À faire',
  in_progress: 'En cours',
  in_review: 'En révision',
  done: 'Terminé',
};

export const DonutChart = ({ data }) => {
  // Transformer les données pour Recharts
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key],
    value: value,
    color: COLORS[key],
  })).filter(item => item.value > 0); // Ne garder que les valeurs > 0

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        Aucune tâche disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
