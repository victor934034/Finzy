import { Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function AIInsightCard({ insight, onRefresh, loading }) {
  return (
    <div className="card border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-primary">Análise da IA</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-4/6" />
        </div>
      ) : (
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{insight || 'Clique em atualizar para gerar uma análise personalizada.'}</p>
      )}
    </div>
  );
}
