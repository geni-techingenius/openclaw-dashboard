import { useState } from 'react';
import { useGateways, useCronJobs } from '../hooks/useGateways';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';

export default function CronJobs() {
  const { data: gateways = [] } = useGateways();
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  const { data: jobs = [], isLoading, refetch } = useCronJobs(selectedGateway);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncCronJobs(selectedGateway);
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const formatSchedule = (job) => {
    const schedule = JSON.parse(job.schedule_data || '{}');
    switch (job.schedule_kind) {
      case 'cron':
        return `Cron: ${schedule.expr || '?'}`;
      case 'every': {
        const ms = schedule.everyMs || 0;
        if (ms >= 3600000) return `Every ${ms / 3600000}h`;
        if (ms >= 60000) return `Every ${ms / 60000}m`;
        return `Every ${ms / 1000}s`;
      }
      case 'at':
        return `At: ${new Date(schedule.atMs).toLocaleString()}`;
      default:
        return job.schedule_kind || 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cron Jobs</h1>
        <p className="text-slate-400 mt-1">Scheduled tasks across your gateways</p>
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
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : '↻ Sync'}
            </button>
          )}
        </div>
      </Card>

      {/* Jobs list */}
      {selectedGateway && (
        <Card>
          <CardHeader 
            title="Jobs" 
            subtitle={`${jobs.length} jobs`}
          />
          
          {isLoading ? (
            <div className="text-slate-400">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No cron jobs found. Click Sync to fetch from gateway.
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-slate-500'}`} />
                        <span className="font-medium text-white">
                          {job.name || 'Unnamed Job'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-slate-400">{formatSchedule(job)}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-600 text-slate-300 rounded">
                          {job.payload_kind}
                        </span>
                        <span className="text-xs text-slate-500">
                          → {job.session_target}
                        </span>
                      </div>
                    </div>
                    {job.next_run_at && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Next run</div>
                        <div className="text-sm text-slate-400">
                          {new Date(job.next_run_at * 1000).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
