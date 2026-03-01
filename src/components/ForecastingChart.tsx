import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

interface DataPoint {
  date: string;
  actual?: number;
  forecast?: number;
}

interface ForecastingChartProps {
  data: DataPoint[];
  title: string;
}

const formatNumber = (value: any) => {
  if (value === undefined || value === null) return '';
  const numValue = Number(value);
  if (isNaN(numValue)) return value;
  
  if (numValue >= 1000000) return `Rp ${(numValue / 1000000).toFixed(1)}M`;
  if (numValue >= 1000) return `Rp ${(numValue / 1000).toFixed(0)}k`;
  return `Rp ${numValue.toLocaleString('id-ID')}`;
};

export const ForecastingChart: React.FC<ForecastingChartProps> = ({ data, title }) => {
  return (
    <div className="glass-panel" style={{ height: 'auto', minHeight: '350px' }}>
      <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>{title}</h3>
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fill: '#94a3b8' }}
              width={45}
            />
            <Tooltip 
              formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ padding: '0px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Area 
              type="monotone" 
              dataKey="actual" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorActual)" 
              strokeWidth={2}
              name="Actual Revenue"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area 
              type="monotone" 
              dataKey="forecast" 
              stroke="#ec4899" 
              fillOpacity={1} 
              fill="url(#colorForecast)" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="AI Forecast"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
