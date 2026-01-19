import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  color?: string;
  yAxisLabel: string;
}

export function TrendChart({ title, data, color = '#11998E', yAxisLabel }: TrendChartProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            stroke="#cbd5e1"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            stroke="#cbd5e1"
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
