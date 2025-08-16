#!/usr/bin/env node

/**
 * HUDU MCP Server
 *
 * Copyright (c) 2025 HUDU MCP Server Contributors
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
        name: 'hudu-mcp',
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
    this.huduClient = new HuduClient(this.config.HUDU_API_KEY, this.config.HUDU_BASE_URL);

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
            description: 'Retrieve a list of companies/customers with advanced filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Filter companies by name',
                },
                phone_number: {
                  type: 'string',
                  description: 'Filter companies by phone number',
                },
                website: {
                  type: 'string',
                  description: 'Filter companies by website',
                },
                city: {
                  type: 'string',
                  description: 'Filter companies by city',
                },
                id_number: {
                  type: 'string',
                  description: 'Filter companies by ID number',
                },
                state: {
                  type: 'string',
                  description: 'Filter companies by state',
                },
                slug: {
                  type: 'string',
                  description: 'Filter companies by URL slug',
                },
                search: {
                  type: 'string',
                  description: 'Filter companies using a search query',
                },
                id_in_integration: {
                  type: 'string',
                  description: 'Filter companies by ID/identifier in PSA/RMM/outside integration',
                },
                updated_at: {
                  type: 'string',
                  description: 'Filter companies updated within a range or at an exact time. Format: "start_datetime,end_datetime" for range, "exact_datetime" for exact match',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
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
            description: 'Search knowledge base articles with advanced filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                search: {
                  type: 'string',
                  description: 'Search query for articles',
                },
                name: {
                  type: 'string',
                  description: 'Filter articles by exact name match',
                },
                company_id: {
                  type: 'number',
                  description: 'Filter articles by company ID',
                },
                slug: {
                  type: 'string',
                  description: 'Filter articles by slug',
                },
                draft: {
                  type: 'boolean',
                  description: 'Filter by draft status (true for drafts, false for published)',
                },
                enable_sharing: {
                  type: 'boolean',
                  description: 'Filter by sharing status (true for shared articles)',
                },
                updated_at: {
                  type: 'string',
                  description: 'Filter by update date. Use ISO 8601 format for exact match, or "start_datetime,end_datetime" for range',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
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
            description: 'Retrieve assets with advanced filtering options',
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
                id: {
                  type: 'number',
                  description: 'Filter assets by their ID',
                },
                name: {
                  type: 'string',
                  description: 'Filter assets by their name',
                },
                primary_serial: {
                  type: 'string',
                  description: 'Filter assets by their primary serial number',
                },
                archived: {
                  type: 'boolean',
                  description: 'Set to true to display only archived assets',
                },
                slug: {
                  type: 'string',
                  description: 'Filter assets by their URL slug',
                },
                search: {
                  type: 'string',
                  description: 'Filter assets using a search query',
                },
                updated_at: {
                  type: 'string',
                  description: 'Filter assets updated within a range or at an exact time. Format: "start_datetime,end_datetime" for range, "exact_datetime" for exact match',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
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
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
                },
              },
            },
          },
          {
            name: 'get_activity_logs',
            description: 'Retrieve activity logs with advanced filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: {
                  type: 'number',
                  description: 'Filter logs by a specific user ID',
                },
                user_email: {
                  type: 'string',
                  description: 'Filter logs by a user\'s email address',
                },
                resource_id: {
                  type: 'number',
                  description: 'Filter logs by resource ID; must be used in conjunction with resource_type',
                },
                resource_type: {
                  type: 'string',
                  description: 'Filter logs by resource type (Asset, AssetPassword, Company, Article, etc.); must be used in conjunction with resource_id',
                },
                action_message: {
                  type: 'string',
                  description: 'Filter logs by the action performed',
                },
                start_date: {
                  type: 'string',
                  description: 'Filter logs starting from a specific date; must be in ISO 8601 format',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
                },
                search: {
                  type: 'string',
                  description: 'Search query for activity logs',
                },
              },
            },
          },
          {
            name: 'get_asset_layouts',
            description: 'Retrieve asset layouts from HUDU',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
                },
              },
            },
          },
          {
            name: 'get_asset_layout',
            description: 'Get detailed information about a specific asset layout',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Asset layout ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_folders',
            description: 'Retrieve folders from HUDU',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Filter folders by name',
                },
                company_id: {
                  type: 'number',
                  description: 'Filter folders by company ID',
                },
                in_company: {
                  type: 'boolean',
                  description: 'When true, only returns company-specific folders',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
                },
              },
            },
          },
          {
            name: 'get_folder',
            description: 'Get detailed information about a specific folder',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Folder ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_users',
            description: 'Retrieve users from HUDU',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Filter users by name',
                },
                email: {
                  type: 'string',
                  description: 'Filter users by email address',
                },
                security_level: {
                  type: 'string',
                  description: 'Filter users by security level (super_admin, admin, spectator, editor, author, portal_member, portal_admin)',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of results per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
                },
              },
            },
          },
          {
            name: 'get_user',
            description: 'Get detailed information about a specific user',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'User ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_networks',
            description: 'Retrieve networks from HUDU',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Filter networks by name',
                },
                company_id: {
                  type: 'number',
                  description: 'Filter networks by company ID',
                },
                location_id: {
                  type: 'number',
                  description: 'Filter networks by location ID',
                },
                created_at: {
                  type: 'string',
                  description: 'Filter networks by creation date (format: start_datetime,end_datetime or exact_datetime)',
                },
                updated_at: {
                  type: 'string',
                  description: 'Filter networks by update date (format: start_datetime,end_datetime or exact_datetime)',
                },
                archived: {
                  type: 'boolean',
                  description: 'Filter networks by archive status',
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
            name: 'get_network',
            description: 'Get detailed information about a specific network',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Network ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_procedures',
            description: 'Get a list of procedures with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Filter by procedure name',
                },
                company_id: {
                  type: 'number',
                  description: 'Filter by company ID',
                },
                global_template: {
                  type: 'string',
                  enum: ['true', 'false'],
                  description: 'Filter for global templates',
                },
                company_template: {
                  type: 'number',
                  description: 'Filter for company-specific templates by company ID',
                },
                parent_procedure_id: {
                  type: 'number',
                  description: 'Filter for child procedures of a specific parent',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                  default: 1,
                  minimum: 1,
                },
                page_size: {
                  type: 'number',
                  description: 'Number of items per page',
                  default: 25,
                  minimum: 1,
                  maximum: 100,
                },
              },
              required: [],
            },
          },
          {
            name: 'get_procedure',
            description: 'Get a specific procedure by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'The ID of the procedure to retrieve',
                },
              },
              required: ['id'],
            },
          },
        ],
      };
    });

    // Register all tools
    registerTools(this.server, this.huduClient);
  }

  private async validateApiConnection(): Promise<void> {
    try {
      console.error('Validating HUDU API connection...');
      const apiInfo = await this.huduClient.getApiInfo();
      console.error(`✓ Connected to HUDU API successfully`);
      console.error(`  API Version: ${apiInfo.version || 'Unknown'}`);
      console.error(`  Base URL: ${this.config.HUDU_BASE_URL}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error(`API key validation failed: Invalid or expired API key. Please check your HUDU_API_KEY.`);
        }
        if (error.message.includes('404') || error.message.includes('ENOTFOUND')) {
          throw new Error(`URL validation failed: Cannot connect to ${this.config.HUDU_BASE_URL}. Please check your HUDU_BASE_URL.`);
        }
        if (error.message.includes('403')) {
          throw new Error(`API access denied: Your API key does not have sufficient permissions.`);
        }
        throw new Error(`API connection failed: ${error.message}`);
      }
      throw new Error(`API connection failed: Unknown error`);
    }
  }

  async run(): Promise<void> {
    // Validate API connection before starting the server
    await this.validateApiConnection();
    
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