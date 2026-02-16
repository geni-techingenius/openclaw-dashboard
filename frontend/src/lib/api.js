/**
 * API client for OpenClaw Dashboard backend
 */

const API_BASE = '/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  }

  // Gateways
  async getGateways() {
    return this.request('/gateways');
  }

  async getGateway(id) {
    return this.request(`/gateways/${id}`);
  }

  async createGateway(data) {
    return this.request('/gateways', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateGateway(id, data) {
    return this.request(`/gateways/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteGateway(id) {
    return this.request(`/gateways/${id}`, {
      method: 'DELETE'
    });
  }

  // Proxy to OpenClaw
  async proxyToGateway(gatewayId, endpoint, method = 'GET', body = null) {
    return this.request(`/gateways/${gatewayId}/proxy`, {
      method: 'POST',
      body: JSON.stringify({ endpoint, method, body })
    });
  }

  // Sessions
  async getSessions(gatewayId) {
    return this.request(`/gateways/${gatewayId}/sessions`);
  }

  async syncSessions(gatewayId) {
    return this.request(`/gateways/${gatewayId}/sync-sessions`, {
      method: 'POST'
    });
  }

  // Cron
  async getCronJobs(gatewayId) {
    return this.request(`/gateways/${gatewayId}/cron`);
  }

  async syncCronJobs(gatewayId) {
    return this.request(`/gateways/${gatewayId}/sync-cron`, {
      method: 'POST'
    });
  }

  // Health
  async health() {
    return this.request('/health');
  }
}

export const api = new ApiClient();
export default api;
