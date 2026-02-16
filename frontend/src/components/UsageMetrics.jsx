import { useState } from 'react';
import Card, { CardHeader } from './Card';

/**
 * Token and cost metrics display
 */
export default function UsageMetrics({ usage = [], onRefresh }) {
  const [timeRange, setTimeRange] = useState('7d');
  
  // Aggregate stats
  const totals = usage.reduce((acc, stat) => ({
    inputTokens: acc.inputTokens + (stat.input_tokens || 0),
    outputTokens: acc.outputTokens + (stat.output_tokens || 0),
    costUsd: acc.costUsd + (stat.cost_usd || 0)
  }), { inputTokens: 0, outputTokens: 0, costUsd: 0 });

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCost = (cost) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  // Group by model
  const byModel = usage.reduce((acc, stat) => {
    const model = stat.model || 'unknown';
    if (!acc[model]) {
      acc[model] = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
    }
    acc[model].inputTokens += stat.input_tokens || 0;
    acc[model].outputTokens += stat.output_tokens || 0;
    acc[model].costUsd += stat.cost_usd || 0;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader 
        title="Usage Metrics" 
        subtitle="Token usage and costs"
        action={
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
              >
                ↻
              </button>
            )}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">
            {formatNumber(totals.inputTokens)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Input Tokens</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {formatNumber(totals.outputTokens)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Output Tokens</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-400">
            {formatCost(totals.costUsd)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Estimated Cost</div>
        </div>
      </div>

      {/* By model breakdown */}
      {Object.keys(byModel).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">By Model</h4>
          <div className="space-y-2">
            {Object.entries(byModel).map(([model, stats]) => (
              <div key={model} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                <span className="text-sm text-white font-mono">{model}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-400">{formatNumber(stats.inputTokens)} in</span>
                  <span className="text-green-400">{formatNumber(stats.outputTokens)} out</span>
                  <span className="text-amber-400">{formatCost(stats.costUsd)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usage.length === 0 && (
        <div className="text-center py-4 text-slate-400">
          No usage data available. Sync to fetch from gateway.
        </div>
      )}
    </Card>
  );
}
