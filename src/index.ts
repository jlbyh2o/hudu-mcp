#!/usr/bin/env node

/**
 * HUDU MCP Server
 *
 * Copyright (c) 2024 HUDU MCP Server Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { HuduClient } from './hudu-client.js';
import { registerTools } from './tools/index.js';

// Configuration schema
const ConfigSchema = z.object({
  HUDU_API_KEY: z.string().min(1, 'HUDU_API_KEY is required'),
  HUDU_BASE_URL: z.string().url('HUDU_BASE_URL must be a valid URL'),
});

type Config = z.infer<typeof ConfigSchema>;

class HuduMcpServer {
  private server: Server;
  private huduClient: HuduClient;
  private config: Config;

  constructor() {
    this.server = new Server(
      {
        name: 'hudu-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize HUDU client
    this.config = this.loadConfig();
    this.huduClient = new HuduClient(this.config.HUDU_BASE_URL, this.config.HUDU_API_KEY);

    this.setupHandlers();
  }

  private loadConfig(): Config {
    try {
      return ConfigSchema.parse({
        HUDU_API_KEY: process.env.HUDU_API_KEY,
        HUDU_BASE_URL: process.env.HUDU_BASE_URL,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        throw new Error(`Configuration validation failed: ${issues}`);
      }
      throw error;
    }
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_companies',
            description: 'Retrieve a list of companies/customers from HUDU',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Filter companies by name',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                },
              },
            },
          },
          {
            name: 'get_company_details',
            description: 'Get detailed information about a specific company',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Company ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'search_articles',
            description: 'Search knowledge base articles',
            inputSchema: {
              type: 'object',
              properties: {
                search: {
                  type: 'string',
                  description: 'Search query for articles',
                },
                company_id: {
                  type: 'number',
                  description: 'Filter articles by company ID',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                },
              },
            },
          },
          {
            name: 'get_article',
            description: 'Get detailed content of a specific article',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Article ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_assets',
            description: 'Retrieve assets for a company',
            inputSchema: {
              type: 'object',
              properties: {
                company_id: {
                  type: 'number',
                  description: 'Company ID to filter assets',
                },
                asset_layout_id: {
                  type: 'number',
                  description: 'Filter by asset layout ID',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                },
              },
            },
          },
          {
            name: 'get_asset_passwords',
            description: 'Retrieve password assets (credentials) for a company',
            inputSchema: {
              type: 'object',
              properties: {
                company_id: {
                  type: 'number',
                  description: 'Company ID to filter passwords',
                },
                name: {
                  type: 'string',
                  description: 'Filter by password name',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                },
              },
            },
          },
        ],
      };
    });

    // Register all tools
    registerTools(this.server, this.huduClient);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HUDU MCP server running on stdio');
  }
}

// Start the server
const server = new HuduMcpServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
