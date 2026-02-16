import { useState, useRef } from 'react';
import Card, { CardHeader } from './Card';

/**
 * Conversation history viewer for a session
 */
export default function ConversationViewer({ 
  messages = [], 
  sessionKey,
  onSync,
  syncing = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);

  const filteredMessages = messages.filter(msg => {
    if (!searchTerm) return true;
    return msg.content?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMessages(newExpanded);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'user': return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 'assistant': return 'bg-violet-500/20 border-violet-500/40 text-violet-300';
      case 'system': return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      default: return 'bg-slate-500/20 border-slate-500/40 text-slate-300';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'user': return '👤 User';
      case 'assistant': return '🤖 Assistant';
      case 'system': return '⚙️ System';
      default: return role;
    }
  };

  // Truncate long messages
  const MAX_PREVIEW = 300;
  const needsTruncation = (content) => content && content.length > MAX_PREVIEW;
  
  const getPreview = (content, id) => {
    if (!content) return '';
    if (expandedMessages.has(id) || content.length <= MAX_PREVIEW) {
      return content;
    }
    return content.substring(0, MAX_PREVIEW) + '...';
  };

  return (
    <Card>
      <CardHeader 
        title="Conversation History" 
        subtitle={sessionKey ? `Session: ${sessionKey}` : 'Select a session'}
        action={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {onSync && (
              <button
                onClick={onSync}
                disabled={syncing}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : '↻ Sync'}
              </button>
            )}
          </div>
        }
      />

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {searchTerm ? 'No messages match your search' : 'No messages. Click Sync to fetch history.'}
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-lg border ${getRoleColor(msg.role)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {getRoleLabel(msg.role)}
                </span>
                <span className="text-xs opacity-70">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              
              <div className="text-sm whitespace-pre-wrap break-words">
                {getPreview(msg.content, msg.id)}
              </div>
              
              {needsTruncation(msg.content) && (
                <button
                  onClick={() => toggleExpand(msg.id)}
                  className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                >
                  {expandedMessages.has(msg.id) ? '▲ Show less' : '▼ Show more'}
                </button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </Card>
  );
}
