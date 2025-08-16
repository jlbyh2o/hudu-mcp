/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { HuduClient } from '../hudu-client.js';
import { handleActivityTools } from './activity-tools.js';
import { handleArticleTools } from './article-tools.js';
import { handleAssetTools } from './asset-tools.js';
import { handleCompanyTools } from './company-tools.js';
import { handleFolderTools } from './folder-tools.js';
import { handleUserTools } from './user-tools.js';
import { handleNetworkTools } from './network-tools.js';
import { handleProcedureTools } from './procedure-tools.js';

/**
 * Register all HUDU MCP tools with the server
 */
export function registerTools(server: Server, huduClient: HuduClient): void {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    try {
      // Route to appropriate tool handler based on tool name
      if (['get_companies', 'get_company_details'].includes(name)) {
        return await handleCompanyTools(request, huduClient);
      }

      if (['search_articles', 'get_article'].includes(name)) {
        return await handleArticleTools(request, huduClient);
      }

      if (['get_assets', 'get_asset_passwords', 'get_asset_layouts', 'get_asset_layout'].includes(name)) {
        return await handleAssetTools(request, huduClient);
      }

      if (['get_activity_logs'].includes(name)) {
        return await handleActivityTools(request, huduClient);
      }

      if (['get_folders', 'get_folder'].includes(name)) {
        return await handleFolderTools(request, huduClient);
      }

      if (['get_users', 'get_user'].includes(name)) {
        return await handleUserTools(name, request.params.arguments, huduClient);
      }

      if (['get_networks', 'get_network'].includes(name)) {
        return await handleNetworkTools(name, request.params.arguments, huduClient);
      }

      if (['get_procedures', 'get_procedure'].includes(name)) {
        return await handleProcedureTools(name, request.params.arguments, huduClient);
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
}
