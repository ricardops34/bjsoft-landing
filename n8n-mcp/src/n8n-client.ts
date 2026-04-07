import axios from 'axios';
import { config } from './config.js';

export class N8nClient {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: config.n8nApiUrl,
      headers: {
        'X-N8N-API-KEY': config.n8nApiKey,
        'Accept': 'application/json',
      },
    });
  }

  async listWorkflows(limit: number = 50, offset: number = 0) {
    const response = await this.client.get('/workflows', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getWorkflow(id: string) {
    const response = await this.client.get(`/workflows/${id}`);
    return response.data;
  }

  async createWorkflow(workflowData: any) {
    const response = await this.client.post('/workflows', workflowData);
    return response.data;
  }

  async updateWorkflow(id: string, workflowData: any) {
    const response = await this.client.patch(`/workflows/${id}`, workflowData);
    return response.data;
  }

  async listExecutions(limit: number = 20, workflowId?: string) {
    const params: any = { limit };
    if (workflowId) params.workflowId = workflowId;
    
    const response = await this.client.get('/executions', { params });
    return response.data;
  }

  async getExecution(id: string) {
    const response = await this.client.get(`/executions/${id}`);
    return response.data;
  }
}
