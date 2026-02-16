import { useState, useEffect, useRef } from 'react';
import Card, { CardHeader } from './Card';

/**
 * Real-time log viewer component
 */
export default function LogViewer({ 
  logs = [],
  onRefresh,
  refreshing = false,
  autoRefresh = false,
  refreshInterval = 5000
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef(null);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh, refreshInterval]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    // Level filter
    if (filter !== 'all' && log.level !== filter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        log.message?.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.meta || {}).toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getLevelStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'text-red-400 bg-red-500/10';
      case 'warn':
      case 'warning': return 'text-amber-400 bg-amber-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      case 'debug': return 'text-slate-400 bg-slate-500/10';
      default: return 'text-slate-300 bg-slate-500/10';
    }
  };

  const getLevelBadge = (level) => {
    const style = {
      error: 'bg-red-500/30 text-red-300',
      warn: 'bg-amber-500/30 text-amber-300',
      warning: 'bg-amber-500/30 text-amber-300',
      info: 'bg-blue-500/30 text-blue-300',
      debug: 'bg-slate-500/30 text-slate-300'
    };
    return style[level?.toLowerCase()] || 'bg-slate-500/30 text-slate-300';
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader 
        title="Logs" 
        subtitle={`${filteredLogs.length} entries`}
        action={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
            >
              <option value="all">All levels</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            
            <input
              type="text"
              placeholder="Filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 w-32"
            />
            
            <label className="flex items-center gap-1 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                {refreshing ? '...' : '↻'}
              </button>
            )}
          </div>
        }
      />

      <div className="font-mono text-sm max-h-[400px] overflow-y-auto bg-slate-900/50 rounded-lg p-3 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-2 p-2 rounded ${getLevelStyle(log.level)}`}
            >
              <span className="text-slate-500 shrink-0">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className={`px-1.5 py-0.5 text-xs rounded uppercase font-medium shrink-0 ${getLevelBadge(log.level)}`}>
                {log.level || 'LOG'}
              </span>
              <span className="break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </Card>
  );
}
