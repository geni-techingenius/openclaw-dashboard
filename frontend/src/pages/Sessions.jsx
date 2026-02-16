import { useState } from 'react';
import { useGateways, useSessions, useSyncSessions } from '../hooks/useGateways';
import Card, { CardHeader } from '../components/Card';

export default function Sessions() {
  const { data: gateways = [] } = useGateways();
  const [selectedGateway, setSelectedGateway] = useState(null);
  
  const { data: sessions = [], isLoading } = useSessions(selectedGateway);
  const syncSessions = useSyncSessions(selectedGateway);

  const handleSync = async () => {
    try {
      await syncSessions.mutateAsync();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sessions</h1>
        <p className="text-slate-400 mt-1">Active sessions across your gateways</p>
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
              disabled={syncSessions.isPending}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {syncSessions.isPending ? 'Syncing...' : '↻ Sync'}
            </button>
          )}
        </div>
      </Card>

      {/* Sessions list */}
      {selectedGateway && (
        <Card>
          <CardHeader 
            title="Sessions" 
            subtitle={`${sessions.length} sessions`}
          />
          
          {isLoading ? (
            <div className="text-slate-400">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No sessions found. Click Sync to fetch from gateway.
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-white font-mono text-sm">
                      {session.session_key}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {session.kind && (
                        <span className="text-xs text-slate-400">{session.kind}</span>
                      )}
                      {session.channel && (
                        <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded">
                          {session.channel}
                        </span>
                      )}
                      {session.model && (
                        <span className="text-xs text-slate-500">{session.model}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">
                      {session.message_count || 0} messages
                    </div>
                    {session.last_message_at && (
                      <div className="text-xs text-slate-500">
                        {new Date(session.last_message_at * 1000).toLocaleString()}
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
