import { useState } from 'react';
import { useGateways, useSessions, useMessages, useSyncMessages, useSyncSessions } from '../hooks/useGateways';
import Card, { CardHeader } from '../components/Card';
import ConversationViewer from '../components/ConversationViewer';

export default function History() {
  const { data: gateways = [] } = useGateways();
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const { data: sessions = [], isLoading: loadingSessions } = useSessions(selectedGateway);
  const syncSessions = useSyncSessions(selectedGateway);
  
  // Build session ID for messages query
  const sessionId = selectedGateway && selectedSession 
    ? `${selectedGateway}_${selectedSession}` 
    : null;
  
  const { data: messages = [], isLoading: loadingMessages, refetch: refetchMessages } = useMessages(sessionId);
  const syncMessages = useSyncMessages(selectedGateway, selectedSession);

  const handleSyncSessions = async () => {
    try {
      await syncSessions.mutateAsync();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSyncMessages = async () => {
    if (!selectedGateway || !selectedSession) return;
    try {
      await syncMessages.mutateAsync();
      refetchMessages();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session.session_key);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Conversation History</h1>
        <p className="text-slate-400 mt-1">Browse message history across sessions</p>
      </div>

      {/* Gateway selector */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-slate-300">Gateway:</label>
          <select
            value={selectedGateway || ''}
            onChange={(e) => {
              setSelectedGateway(e.target.value || null);
              setSelectedSession(null);
            }}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select a gateway</option>
            {gateways.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          
          {selectedGateway && (
            <button
              onClick={handleSyncSessions}
              disabled={syncSessions.isPending}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {syncSessions.isPending ? 'Syncing...' : '↻ Sync Sessions'}
            </button>
          )}
        </div>
      </Card>

      {/* Sessions & Messages */}
      {selectedGateway && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader 
                title="Sessions" 
                subtitle={`${sessions.length} sessions`}
              />
              
              {loadingSessions ? (
                <div className="text-slate-400">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-4 text-slate-400">
                  No sessions. Click Sync Sessions.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSession === session.session_key
                          ? 'bg-violet-600/30 border border-violet-500/50'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="font-mono text-sm text-white truncate">
                        {session.session_key}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {session.channel && (
                          <span className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded">
                            {session.channel}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {session.message_count || 0} msgs
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Conversation viewer */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              loadingMessages ? (
                <Card>
                  <div className="text-slate-400 text-center py-8">Loading messages...</div>
                </Card>
              ) : (
                <ConversationViewer 
                  messages={messages}
                  sessionKey={selectedSession}
                  onSync={handleSyncMessages}
                  syncing={syncMessages.isPending}
                />
              )
            ) : (
              <Card>
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg mb-2">👈 Select a session</p>
                  <p className="text-sm">Choose a session from the list to view its conversation history</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
