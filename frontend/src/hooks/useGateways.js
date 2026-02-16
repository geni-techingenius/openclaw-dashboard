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
