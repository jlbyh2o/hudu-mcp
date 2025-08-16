/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

// Input schemas for activity tools
const GetActivityLogsSchema = z.object({
  user_id: z.number().optional(),
  user_email: z.string().optional(),
  resource_id: z.number().optional(),
  resource_type: z.string().optional(),
  action_message: z.string().optional(),
  start_date: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
  search: z.string().optional(),
});

/**
 * Handle activity-related tool requests
 */
export async function handleActivityTools(
  request: any,
  huduClient: HuduClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_activity_logs': {
        const params = GetActivityLogsSchema.parse(args);
        const response = await huduClient.getActivityLogs(params);

        return createMcpResponse(
          {
            activity_logs: response.data || [],
            pagination: response.meta || {},
            summary: `Retrieved ${response.data?.length || 0} activity log entries`,
          },
          `Retrieved ${response.data?.length || 0} activity log entries`
        );
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown activity tool: ${name}`);
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