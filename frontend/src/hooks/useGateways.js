import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useGateways() {
  return useQuery({
    queryKey: ['gateways'],
    queryFn: () => api.getGateways(),
    refetchInterval: 30000 // Refresh every 30s
  });
}

export function useGateway(id) {
  return useQuery({
    queryKey: ['gateways', id],
    queryFn: () => api.getGateway(id),
    enabled: !!id
  });
}

export function useCreateGateway() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.createGateway(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    }
  });
}

export function useUpdateGateway() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGateway(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    }
  });
}

export function useDeleteGateway() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.deleteGateway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    }
  });
}

export function useSyncSessions(gatewayId) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.syncSessions(gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', gatewayId] });
    }
  });
}

export function useSessions(gatewayId) {
  return useQuery({
    queryKey: ['sessions', gatewayId],
    queryFn: () => api.getSessions(gatewayId),
    enabled: !!gatewayId
  });
}

export function useCronJobs(gatewayId) {
  return useQuery({
    queryKey: ['cron', gatewayId],
    queryFn: () => api.getCronJobs(gatewayId),
    enabled: !!gatewayId
  });
}

// Messages
export function useMessages(sessionId) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => api.getMessages(sessionId),
    enabled: !!sessionId
  });
}

export function useSyncMessages(gatewayId, sessionKey) {
  const queryClient = useQueryClient();
  const sessionId = `${gatewayId}_${sessionKey}`;
  
  return useMutation({
    mutationFn: () => api.syncMessages(gatewayId, sessionKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
    }
  });
}

// Usage Stats
export function useUsageStats(gatewayId, days = 7) {
  return useQuery({
    queryKey: ['usage', gatewayId, days],
    queryFn: () => api.getUsageStats(gatewayId, days),
    enabled: !!gatewayId
  });
}

export function useSyncUsage(gatewayId) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.syncUsage(gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage', gatewayId] });
    }
  });
}

// Logs
export function useLogs(gatewayId, options = {}) {
  const { limit = 100, level = 'info', refetchInterval } = options;
  
  return useQuery({
    queryKey: ['logs', gatewayId, limit, level],
    queryFn: async () => {
      const result = await api.getLogs(gatewayId, limit, level);
      return result.logs || [];
    },
    enabled: !!gatewayId,
    refetchInterval
  });
}
