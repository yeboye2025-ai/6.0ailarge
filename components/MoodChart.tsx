
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoodDataPoint } from '../types';

interface MoodChartProps {
  data: MoodDataPoint[];
  themeColor: string;
}

const themeColorHex: Record<string, string> = {
  pink: '#ec4899',
  purple: '#a855f7',
  indigo: '#6366f1'
};

export const MoodChart: React.FC<MoodChartProps> = ({ data, themeColor }) => {
  if (data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400 italic">No data yet</div>;

  const primaryColor = themeColorHex[themeColor] || '#ec4899';

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#94a3b8'}}
          />
          <YAxis hide domain={[0, 6]} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border border-gray-100 shadow-xl rounded-lg text-xs">
                    <p className="font-bold text-gray-700">{payload[0].payload.date}</p>
                    <p style={{ color: primaryColor }} className="font-semibold">Mood Score: {payload[0].value}</p>
                    <p className="text-2xl mt-1">{payload[0].payload.mood}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke={primaryColor} 
            fillOpacity={1} 
            fill="url(#colorMood)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
