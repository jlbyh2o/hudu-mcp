/**
 * Copyright (c) 2024 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { z } from 'zod';

// Response schemas based on HUDU API specification
export const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().optional(),
  company_type: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country_name: z.string().optional(),
  phone_number: z.string().optional(),
  fax_number: z.string().optional(),
  website: z.string().optional(),
  id_number: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ArticleSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  slug: z.string(),
  company_id: z.number().optional(),
  folder_id: z.number().optional(),
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  company_id: z.number(),
  asset_layout_id: z.number(),
  slug: z.string(),
  primary_serial: z.string().optional(),
  primary_model: z.string().optional(),
  primary_manufacturer: z.string().optional(),
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AssetPasswordSchema = z.object({
  id: z.number(),
  name: z.string(),
  company_id: z.number(),
  description: z.string().optional(),
  username: z.string().optional(),
  password: z.string(),
  otp_secret: z.string().optional(),
  url: z.string().optional(),
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AssetLayoutSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  icon_color: z.string().optional(),
  fields: z.array(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Company = z.infer<typeof CompanySchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type AssetPassword = z.infer<typeof AssetPasswordSchema>;
export type AssetLayout = z.infer<typeof AssetLayoutSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface SearchParams {
  page?: number;
  page_size?: number;
  search?: string;
  name?: string;
  company_id?: number;
  asset_layout_id?: number;
}

export class HuduClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;
          throw new Error(`HUDU API Error (${status}): ${message}`);
        } else if (error.request) {
          throw new Error('HUDU API Error: No response received');
        } else {
          throw new Error(`HUDU API Error: ${error.message}`);
        }
      }
    );
  }

  // Companies API
  async getCompanies(params: SearchParams = {}): Promise<PaginatedResponse<Company>> {
    const response: AxiosResponse = await this.client.get('/api/v1/companies', { params });
    return {
      data: response.data.companies?.map((company: any) => CompanySchema.parse(company)) || [],
      meta: response.data.meta,
    };
  }

  async getCompany(id: number): Promise<Company> {
    const response: AxiosResponse = await this.client.get(`/api/v1/companies/${id}`);
    return CompanySchema.parse(response.data.company);
  }

  // Articles API
  async getArticles(params: SearchParams = {}): Promise<PaginatedResponse<Article>> {
    const response: AxiosResponse = await this.client.get('/api/v1/articles', { params });
    return {
      data: response.data.articles?.map((article: any) => ArticleSchema.parse(article)) || [],
      meta: response.data.meta,
    };
  }

  async getArticle(id: number): Promise<Article> {
    const response: AxiosResponse = await this.client.get(`/api/v1/articles/${id}`);
    return ArticleSchema.parse(response.data.article);
  }

  // Assets API
  async getAssets(params: SearchParams = {}): Promise<PaginatedResponse<Asset>> {
    const response: AxiosResponse = await this.client.get('/api/v1/assets', { params });
    return {
      data: response.data.assets?.map((asset: any) => AssetSchema.parse(asset)) || [],
      meta: response.data.meta,
    };
  }

  async getAsset(id: number): Promise<Asset> {
    const response: AxiosResponse = await this.client.get(`/api/v1/assets/${id}`);
    return AssetSchema.parse(response.data.asset);
  }

  // Asset Passwords API
  async getAssetPasswords(params: SearchParams = {}): Promise<PaginatedResponse<AssetPassword>> {
    const response: AxiosResponse = await this.client.get('/api/v1/asset_passwords', { params });
    return {
      data:
        response.data.asset_passwords?.map((password: any) =>
          AssetPasswordSchema.parse(password)
        ) || [],
      meta: response.data.meta,
    };
  }

  async getAssetPassword(id: number): Promise<AssetPassword> {
    const response: AxiosResponse = await this.client.get(`/api/v1/asset_passwords/${id}`);
    return AssetPasswordSchema.parse(response.data.asset_password);
  }

  // Asset Layouts API
  async getAssetLayouts(params: SearchParams = {}): Promise<PaginatedResponse<AssetLayout>> {
    const response: AxiosResponse = await this.client.get('/api/v1/asset_layouts', { params });
    return {
      data:
        response.data.asset_layouts?.map((layout: any) => AssetLayoutSchema.parse(layout)) || [],
      meta: response.data.meta,
    };
  }

  async getAssetLayout(id: number): Promise<AssetLayout> {
    const response: AxiosResponse = await this.client.get(`/api/v1/asset_layouts/${id}`);
    return AssetLayoutSchema.parse(response.data.asset_layout);
  }

  // API Info
  async getApiInfo(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/api/v1/api_info');
    return response.data;
  }

  // Activity Logs
  async getActivityLogs(params: SearchParams = {}): Promise<any> {
    const response: AxiosResponse = await this.client.get('/api/v1/activity_logs', { params });
    return response.data;
  }
}
