#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { N8nClient } from './n8n-client.js';
import { z } from 'zod';

class N8nMcpServer {
  private server: Server;
  private n8nClient: N8nClient;

  constructor() {
    this.n8nClient = new N8nClient();
    this.server = new Server(
      {
        name: 'n8n-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'n8n_list_workflows',
          description: 'List workflows from the n8n instance',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of workflows to return', default: 50 },
              offset: { type: 'number', description: 'Offset for pagination', default: 0 },
            },
          },
        },
        {
          name: 'n8n_get_workflow',
          description: 'Get details of a specific workflow',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The ID of the workflow' },
            },
            required: ['id'],
          },
        },
        {
          name: 'n8n_create_workflow',
          description: 'Create a new workflow in n8n',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the workflow' },
              nodes: { type: 'array', description: 'Nodes configuration' },
              connections: { type: 'object', description: 'Connections configuration' },
            },
            required: ['name', 'nodes', 'connections'],
          },
        },
        {
          name: 'n8n_update_workflow',
          description: 'Update an existing workflow in n8n',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The ID of the workflow' },
              name: { type: 'string', description: 'New name of the workflow' },
              nodes: { type: 'array', description: 'Updated nodes configuration' },
              connections: { type: 'object', description: 'Updated connections configuration' },
              active: { type: 'boolean', description: 'Whether the workflow is active' },
            },
            required: ['id'],
          },
        },
        {
          name: 'n8n_list_executions',
          description: 'List recent executions',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of executions to return', default: 20 },
              workflowId: { type: 'string', description: 'Optional workflow ID to filter executions' },
            },
          },
        },
        {
          name: 'n8n_get_execution',
          description: 'Get details of a specific execution',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The ID of the execution' },
            },
            required: ['id'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'n8n_list_workflows': {
            const { limit, offset } = request.params.arguments as any;
            const workflows = await this.n8nClient.listWorkflows(limit, offset);
            return {
              content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }],
            };
          }
          case 'n8n_get_workflow': {
            const { id } = request.params.arguments as any;
            const workflow = await this.n8nClient.getWorkflow(id);
            return {
              content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }],
            };
          }
          case 'n8n_create_workflow': {
            const workflowData = request.params.arguments;
            const response = await this.n8nClient.createWorkflow(workflowData);
            return {
              content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
            };
          }
          case 'n8n_update_workflow': {
            const { id, ...workflowData } = request.params.arguments as any;
            const response = await this.n8nClient.updateWorkflow(id, workflowData);
            return {
              content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
            };
          }
          case 'n8n_list_executions': {
            const { limit, workflowId } = request.params.arguments as any;
            const executions = await this.n8nClient.listExecutions(limit, workflowId);
            return {
              content: [{ type: 'text', text: JSON.stringify(executions, null, 2) }],
            };
          }
          case 'n8n_get_execution': {
            const { id } = request.params.arguments as any;
            const execution = await this.n8nClient.getExecution(id);
            return {
              content: [{ type: 'text', text: JSON.stringify(execution, null, 2) }],
            };
          }
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error calling n8n API: ${error.response?.data?.message || error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('n8n MCP server running on stdio');
  }
}

const server = new N8nMcpServer();
server.run().catch(console.error);
