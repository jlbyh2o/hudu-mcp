/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';

// Input schemas for company tools
const GetCompaniesSchema = z.object({
  name: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

const GetCompanyDetailsSchema = z.object({
  id: z.number().min(1),
});

export async function handleCompanyTools(request: any, huduClient: HuduClient): Promise<any> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_companies': {
        const params = GetCompaniesSchema.parse(args);
        const result = await huduClient.getCompanies({
          name: params.name,
          page: params.page,
          page_size: params.page_size,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  companies: result.data,
                  pagination: result.meta,
                  summary: `Found ${result.data.length} companies${params.name ? ` matching "${params.name}"` : ''}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_company_details': {
        const params = GetCompanyDetailsSchema.parse(args);
        const company = await huduClient.getCompany(params.id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  company,
                  summary: `Details for company: ${company.name}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown company tool: ${name}`);
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
