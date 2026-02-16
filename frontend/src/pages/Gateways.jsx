import { useState } from 'react';
import { useGateways, useCreateGateway, useDeleteGateway } from '../hooks/useGateways';
import Card, { CardHeader } from '../components/Card';
import StatusBadge from '../components/StatusBadge';

export default function Gateways() {
  const { data: gateways = [], isLoading } = useGateways();
  const createGateway = useCreateGateway();
  const deleteGateway = useDeleteGateway();
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', token: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createGateway.mutateAsync(form);
      setForm({ name: '', url: '', token: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Delete gateway "${name}"?`)) {
      await deleteGateway.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gateways</h1>
          <p className="text-slate-400 mt-1">Manage your OpenClaw instances</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-md transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Gateway'}
        </button>
      </div>

      {/* Add gateway form */}
      {showForm && (
        <Card>
          <CardHeader title="Add New Gateway" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Gateway"
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="http://localhost:4445"
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Token</label>
              <input
                type="password"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                placeholder="Gateway API token"
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={createGateway.isPending}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
            >
              {createGateway.isPending ? 'Creating...' : 'Create Gateway'}
            </button>
          </form>
        </Card>
      )}

      {/* Gateways list */}
      <div className="space-y-4">
        {gateways.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-slate-400">
              No gateways configured. Add one to get started.
            </div>
          </Card>
        ) : (
          gateways.map((gateway) => (
            <Card key={gateway.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{gateway.name}</h3>
                    <StatusBadge status={gateway.status} />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{gateway.url}</p>
                  {gateway.last_seen_at && (
                    <p className="text-xs text-slate-500 mt-2">
                      Last seen: {new Date(gateway.last_seen_at * 1000).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(gateway.id, gateway.name)}
                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
