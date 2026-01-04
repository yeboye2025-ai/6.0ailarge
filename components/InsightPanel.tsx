
import React from 'react';
import { InsightData } from '../types';
import { Sparkles, TrendingUp, Target, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { locales, Language } from '../locales';

interface InsightPanelProps {
  insights: InsightData;
  loading: boolean;
  lang: Language;
  themeColor: string;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ insights, loading, lang, themeColor }) => {
  const t = locales[lang];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <div className={`w-12 h-12 border-4 border-${themeColor}-100 border-t-${themeColor}-600 rounded-full animate-spin`}></div>
          <Sparkles className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-${themeColor}-400`} size={16} />
        </div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">{t.aiThinking}</p>
      </div>
    );
  }

  if (!insights.summary) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm italic">{t.noData}</div>
    );
  }

  return (
    <div className="space-y-6 pb-6 px-1">
      {/* Summary Card */}
      <div className={`bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-400 rounded-2xl p-6 text-white shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300 fill-yellow-300" />
            <h3 className="font-bold text-lg">
              {insights.period === 'weekly' ? t.weeklyReflection : t.monthlyReflection}
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded">{t.aiAnalysis}</span>
        </div>
        <p className="text-sm leading-relaxed opacity-95 mb-4">
          {insights.summary}
        </p>
        <div className="flex flex-wrap gap-2">
          {insights.topTopics.map((topic, i) => (
            <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-semibold">#{topic}</span>
          ))}
        </div>
      </div>

      {/* Patterns & Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patterns */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className={`text-${themeColor}-500`} />
            <h4 className="font-bold text-gray-800 text-sm">{t.emotionalPatterns}</h4>
          </div>
          <ul className="space-y-3">
            {insights.patterns.map((pattern, i) => (
              <li key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                <div className={`mt-1 w-2 h-2 rounded-full bg-${themeColor}-500 shrink-0`} />
                <p className="text-xs text-gray-700 font-medium leading-snug">{pattern}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Triggers */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-orange-500" />
            <h4 className="font-bold text-gray-800 text-sm">{t.keyTriggers}</h4>
          </div>
          <div className="space-y-3">
            {insights.triggers.map((trigger, i) => (
              <div key={i} className="flex flex-col p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-800">{trigger.theme}</span>
                  {trigger.moodImpact === 'positive' ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 italic">{trigger.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Steps */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-emerald-500" />
          <h4 className="font-bold text-gray-800 text-sm">{t.growthRoadmap}</h4>
        </div>
        <div className="space-y-4">
          {insights.growthAdvice.map((advice, i) => (
            <div key={i} className="relative pl-6 pb-2 last:pb-0">
              <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-emerald-100 border-2 border-emerald-500" />
              
              <div className="flex flex-col bg-emerald-50/30 rounded-xl p-3 border border-emerald-100/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">{advice.category}</span>
                <p className="text-xs font-bold text-gray-800 mb-1">{advice.tip}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-600 bg-white p-2 rounded-lg mt-1 border border-emerald-50 shadow-sm">
                  <Zap size={10} className="text-emerald-500 fill-emerald-500" />
                  <span className="font-medium">{t.action}:</span> {advice.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
