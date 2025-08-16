/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

// Input schemas for folder tools
const GetFoldersSchema = z.object({
  name: z.string().optional(),
  company_id: z.number().min(1).optional(),
  in_company: z.boolean().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

const GetFolderSchema = z.object({
  id: z.number().min(1),
});

/**
 * Handle folder-related tool requests
 */
export async function handleFolderTools(
  request: any,
  huduClient: HuduClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_folders': {
        const params = GetFoldersSchema.parse(args);
        const result = await huduClient.getFolders({
          name: params.name,
          company_id: params.company_id,
          page: params.page,
          page_size: params.page_size,
        });

        return createMcpResponse(
          {
            folders: result.data,
            pagination: result.meta,
            summary: `Found ${result.data.length} folders${params.name ? ` matching "${params.name}"` : ''}${params.company_id ? ` for company ID ${params.company_id}` : ''}`,
          },
          `Found ${result.data.length} folders${params.name ? ` matching "${params.name}"` : ''}${params.company_id ? ` for company ID ${params.company_id}` : ''}`
        );
      }

      case 'get_folder': {
        const params = GetFolderSchema.parse(args);
        const folder = await huduClient.getFolder(params.id);

        return createMcpResponse(
          {
            folder,
            summary: `Folder details for: ${folder.name}`,
          },
          `Folder details for: ${folder.name}`
        );
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown folder tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
      );
    }

    if (error instanceof Error) {
      throw new McpError(ErrorCode.InternalError, `Failed to execute ${name}: ${error.message}`);
    }

    throw new McpError(ErrorCode.InternalError, `Unknown error occurred while executing ${name}`);
  }
}