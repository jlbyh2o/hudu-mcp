/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

// Input schemas for company tools
const GetCompaniesSchema = z.object({
  name: z.string().optional(),
  phone_number: z.string().optional(),
  website: z.string().optional(),
  city: z.string().optional(),
  id_number: z.string().optional(),
  state: z.string().optional(),
  slug: z.string().optional(),
  search: z.string().optional(),
  id_in_integration: z.string().optional(),
  updated_at: z.string().optional(),
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
          phone_number: params.phone_number,
          website: params.website,
          city: params.city,
          id_number: params.id_number,
          state: params.state,
          slug: params.slug,
          search: params.search,
          id_in_integration: params.id_in_integration,
          updated_at: params.updated_at,
          page: params.page,
          page_size: params.page_size,
        });

        return createMcpResponse(
          {
            companies: result.data,
            pagination: result.meta,
            summary: `Found ${result.data.length} companies${params.name ? ` matching "${params.name}"` : ''}`,
          },
          `Found ${result.data.length} companies${params.name ? ` matching "${params.name}"` : ''}`
        );
      }

      case 'get_company_details': {
        const params = GetCompanyDetailsSchema.parse(args);
        const company = await huduClient.getCompany(params.id);

        return createMcpResponse(
          {
            company,
            summary: `Details for company: ${company.name}`,
          },
          `Details for company: ${company.name}`
        );
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
