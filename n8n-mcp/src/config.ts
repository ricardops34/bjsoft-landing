import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  n8nApiUrl: process.env.N8N_API_URL || 'https://n8n.bjsoft.com.br/api/v1',
  n8nApiKey: process.env.N8N_API_KEY || '',
  port: process.env.PORT || 3000,
};

if (!config.n8nApiKey) {
  console.warn('Warning: N8N_API_KEY is not set in environment variables.');
}
