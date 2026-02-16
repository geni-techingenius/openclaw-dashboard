/* eslint-disable no-undef */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

describe('ApiClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('makes GET requests correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: '1', name: 'Gateway 1' }])
    });

    const result = await api.getGateways();
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gateways',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result).toEqual([{ id: '1', name: 'Gateway 1' }]);
  });

  it('makes POST requests correctly', async () => {
    const newGateway = { name: 'Test', url: 'http://localhost', token: 'abc' };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'gw_123', ...newGateway })
    });

    const result = await api.createGateway(newGateway);
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gateways',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newGateway)
      })
    );
    expect(result.id).toBe('gw_123');
  });

  it('throws error on non-ok response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });

    await expect(api.getGateway('invalid')).rejects.toThrow('Not found');
  });

  it('handles proxy requests', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [] })
    });

    await api.proxyToGateway('gw_1', '/sessions');
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gateways/gw_1/proxy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ endpoint: '/sessions', method: 'GET', body: null })
      })
    );
  });
});
