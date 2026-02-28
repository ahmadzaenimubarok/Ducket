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

export const ForecastingChart: React.FC<ForecastingChartProps> = ({ data, title }) => {
  return (
    <div className="glass-panel" style={{ height: '400px' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
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
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
          />
          <Tooltip 
            formatter={(value: any) => {
              if (value === undefined || value === null) return '';
              const numValue = Number(value);
              return !isNaN(numValue) ? `Rp ${numValue.toLocaleString('id-ID')}` : value;
            }}
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              color: '#f8fafc' 
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="#6366f1" 
            fillOpacity={1} 
            fill="url(#colorActual)" 
            strokeWidth={3}
            name="Actual Revenue"
          />
          <Area 
            type="monotone" 
            dataKey="forecast" 
            stroke="#ec4899" 
            fillOpacity={1} 
            fill="url(#colorForecast)" 
            strokeWidth={3}
            strokeDasharray="5 5"
            name="AI Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
