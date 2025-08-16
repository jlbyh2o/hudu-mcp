/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

// Input schemas for article tools
const SearchArticlesSchema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  company_id: z.number().min(1).optional(),
  slug: z.string().optional(),
  draft: z.boolean().optional(),
  enable_sharing: z.boolean().optional(),
  updated_at: z.string().optional(),
  page: z.number().min(1).optional(),
  page_size: z.number().min(1).max(100).optional(),
});

const GetArticleSchema = z.object({
  id: z.number().min(1),
});

export async function handleArticleTools(request: any, huduClient: HuduClient): Promise<any> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_articles': {
        const params = SearchArticlesSchema.parse(args);
        const result = await huduClient.getArticles({
          search: params.search,
          name: params.name,
          company_id: params.company_id,
          slug: params.slug,
          draft: params.draft,
          enable_sharing: params.enable_sharing,
          updated_at: params.updated_at,
          page: params.page,
          page_size: params.page_size,
        });

        // Create a summary of articles without full content for search results
        const articleSummaries = result.data.map((article) => ({
          id: article.id,
          name: article.name,
          slug: article.slug,
          company_id: article.company_id,
          archived: article.archived,
          created_at: article.created_at,
          updated_at: article.updated_at,
          content_preview:
            article.content && article.content.length > 200
              ? `${article.content.substring(0, 200)}...`
              : article.content || 'No content available',
        }));

        return createMcpResponse(
          {
            articles: articleSummaries,
            pagination: result.meta,
            summary: `Found ${result.data.length} articles${params.search ? ` matching "${params.search}"` : ''}${params.company_id ? ` for company ID ${params.company_id}` : ''}`,
          },
          `Found ${result.data.length} articles${params.search ? ` matching "${params.search}"` : ''}${params.company_id ? ` for company ID ${params.company_id}` : ''}`
        );
      }

      case 'get_article': {
        const params = GetArticleSchema.parse(args);
        const article = await huduClient.getArticle(params.id);

        return createMcpResponse(
          {
            article,
            summary: `Full content for article: ${article.name}`,
          },
          `Full content for article: ${article.name}`
        );
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown article tool: ${name}`);
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