/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

// Input schemas for asset tools
const GetAssetsSchema = z.object({
  company_id: z.number().min(1).optional(),
  asset_layout_id: z.number().min(1).optional(),
  id: z.number().min(1).optional(),
  name: z.string().optional(),
  primary_serial: z.string().optional(),
  archived: z.boolean().optional(),
  slug: z.string().optional(),
  search: z.string().optional(),
  updated_at: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

const GetAssetPasswordsSchema = z.object({
  company_id: z.number().min(1).optional(),
  name: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

const GetAssetLayoutsSchema = z.object({
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

const GetAssetLayoutSchema = z.object({
  id: z.number().min(1),
});

export async function handleAssetTools(request: any, huduClient: HuduClient): Promise<any> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_assets': {
        const params = GetAssetsSchema.parse(args);
        const result = await huduClient.getAssets({
          company_id: params.company_id,
          asset_layout_id: params.asset_layout_id,
          id: params.id,
          name: params.name,
          primary_serial: params.primary_serial,
          archived: params.archived,
          slug: params.slug,
          search: params.search,
          updated_at: params.updated_at,
          page: params.page,
          page_size: params.page_size,
        });

        return createMcpResponse(
          {
            assets: result.data,
            pagination: result.meta,
            summary: `Found ${result.data.length} assets${params.company_id ? ` for company ID ${params.company_id}` : ''}${params.asset_layout_id ? ` with layout ID ${params.asset_layout_id}` : ''}`,
          },
          `Found ${result.data.length} assets${params.company_id ? ` for company ID ${params.company_id}` : ''}${params.asset_layout_id ? ` with layout ID ${params.asset_layout_id}` : ''}`
        );
      }

      case 'get_asset_passwords': {
        const params = GetAssetPasswordsSchema.parse(args);
        
        try {
          const result = await huduClient.getAssetPasswords({
            company_id: params.company_id,
            name: params.name,
            page: params.page,
            page_size: params.page_size,
          });

          // Mask passwords in the response for security
          const maskedPasswords = result.data.map((password) => ({
            ...password,
            password: '***MASKED***',
            otp_secret: password.otp_secret ? '***MASKED***' : undefined,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    asset_passwords: maskedPasswords,
                    pagination: result.meta,
                    summary: `Found ${result.data.length} password assets${params.company_id ? ` for company ID ${params.company_id}` : ''}${params.name ? ` matching "${params.name}"` : ''}`,
                    note: 'Passwords are masked for security. Use get_asset_password_details for full access.',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes('HUDU API Error (401)')) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: 'Access Denied',
                      message: 'Your API key does not have permission to access password data. This is a security feature in Hudu that can be configured per API key.',
                      suggestion: 'Contact your Hudu administrator to enable password access for your API key, or use other asset management tools that don\'t require password permissions.',
                      asset_passwords: [],
                      pagination: { current_page: 1, per_page: 0, total_pages: 0, total_count: 0 }
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
          throw error;
        }
      }

      case 'get_asset_layouts': {
        const params = GetAssetLayoutsSchema.parse(args);
        const result = await huduClient.getAssetLayouts(params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  asset_layouts: result.data,
                  pagination: result.meta,
                  summary: `Found ${result.data.length} asset layouts`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_asset_layout': {
        const params = GetAssetLayoutSchema.parse(args);
        const layout = await huduClient.getAssetLayout(params.id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  asset_layout: layout,
                  summary: `Asset layout details for: ${layout.name}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown asset tool: ${name}`);
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