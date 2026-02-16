import { useGateways } from '../hooks/useGateways';
import Card, { CardHeader } from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: gateways = [], isLoading, error } = useGateways();
  
  const stats = {
    total: gateways.length,
    online: gateways.filter(g => g.status === 'online').length,
    offline: gateways.filter(g => g.status === 'offline').length,
    error: gateways.filter(g => g.status === 'error').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Monitor your OpenClaw gateways</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-slate-400 mt-1">Total Gateways</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-green-400">{stats.online}</div>
          <div className="text-sm text-slate-400 mt-1">Online</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-red-400">{stats.offline}</div>
          <div className="text-sm text-slate-400 mt-1">Offline</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-amber-400">{stats.error}</div>
          <div className="text-sm text-slate-400 mt-1">Errors</div>
        </Card>
      </div>

      {/* Gateways list */}
      <Card>
        <CardHeader 
          title="Gateways" 
          subtitle={`${gateways.length} configured`}
          action={
            <Link 
              to="/gateways/new"
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              + Add Gateway
            </Link>
          }
        />
        
        {gateways.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No gateways configured yet</p>
            <Link 
              to="/gateways/new"
              className="text-violet-400 hover:text-violet-300"
            >
              Add your first gateway →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {gateways.map((gateway) => (
              <Link
                key={gateway.id}
                to={`/gateways/${gateway.id}`}
                className="flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div>
                  <div className="font-medium text-white">{gateway.name}</div>
                  <div className="text-sm text-slate-400">{gateway.url}</div>
                </div>
                <StatusBadge status={gateway.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
