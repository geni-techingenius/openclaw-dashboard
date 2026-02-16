import { useState } from 'react';
import { useGateways, useUsageStats, useSyncUsage, useLogs } from '../hooks/useGateways';
import Card, { CardHeader } from '../components/Card';
import UsageMetrics from '../components/UsageMetrics';
import LogViewer from '../components/LogViewer';

export default function Usage() {
  const { data: gateways = [] } = useGateways();
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [days] = useState(7);
  
  const { data: usage = [], isLoading: loadingUsage } = useUsageStats(selectedGateway, days);
  const syncUsage = useSyncUsage(selectedGateway);
  const { data: logs = [], isLoading: loadingLogs, refetch: refetchLogs } = useLogs(selectedGateway, {
    refetchInterval: 10000 // Poll every 10s
  });

  const handleSyncUsage = async () => {
    try {
      await syncUsage.mutateAsync();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Usage & Logs</h1>
        <p className="text-slate-400 mt-1">Monitor token usage, costs, and logs</p>
      </div>

      {/* Gateway selector */}
      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">Gateway:</label>
          <select
            value={selectedGateway || ''}
            onChange={(e) => setSelectedGateway(e.target.value || null)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select a gateway</option>
            {gateways.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          
          {selectedGateway && (
            <button
              onClick={handleSyncUsage}
              disabled={syncUsage.isPending}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {syncUsage.isPending ? 'Syncing...' : '↻ Sync Usage'}
            </button>
          )}
        </div>
      </Card>

      {/* Usage Metrics */}
      {selectedGateway && (
        <>
          {loadingUsage ? (
            <Card>
              <div className="text-slate-400 text-center py-8">Loading usage data...</div>
            </Card>
          ) : (
            <UsageMetrics 
              usage={usage}
              onRefresh={handleSyncUsage}
            />
          )}

          {/* Logs */}
          {loadingLogs ? (
            <Card>
              <div className="text-slate-400 text-center py-8">Loading logs...</div>
            </Card>
          ) : (
            <LogViewer 
              logs={logs}
              onRefresh={refetchLogs}
              refreshing={loadingLogs}
              autoRefresh={true}
            />
          )}
        </>
      )}
    </div>
  );
}
