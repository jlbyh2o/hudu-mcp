/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

import axios, { AxiosInstance } from 'axios';

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface SearchParams extends PaginationParams {
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
  };
}

/**
 * Normalize pagination parameters to ensure they are valid numbers within reasonable bounds
 */
export function normalizePaginationParams(params: PaginationParams): PaginationParams {
  const normalized: PaginationParams = {};
  
  if (params.page !== undefined) {
    normalized.page = Math.max(1, Math.floor(Number(params.page) || 1));
  }
  
  if (params.page_size !== undefined) {
    normalized.page_size = Math.max(1, Math.min(100, Math.floor(Number(params.page_size) || 25)));
  }
  
  return normalized;
}

/**
 * HUDU API Client
 */
export class HuduClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getApiInfo(): Promise<any> {
    const response = await this.client.get('/api/v1/api_info');
    return response.data;
  }

  async getCompanies(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/companies', { params: normalizedParams });
    return {
      data: response.data.companies || [],
      meta: response.data.meta || {},
    };
  }

  async getCompany(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/companies/${id}`);
    return response.data.company;
  }

  async getArticles(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/articles', { params: normalizedParams });
    return {
      data: response.data.articles || [],
      meta: response.data.meta || {},
    };
  }

  async getArticle(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/articles/${id}`);
    return response.data.article;
  }

  async getAssets(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/assets', { params: normalizedParams });
    return {
      data: response.data.assets || [],
      meta: response.data.meta || {},
    };
  }

  async getAssetPasswords(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/asset_passwords', { params: normalizedParams });
    return {
      data: response.data.asset_passwords || [],
      meta: response.data.meta || {},
    };
  }

  async getAssetLayouts(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/asset_layouts', { params: normalizedParams });
    return {
      data: response.data.asset_layouts || [],
      meta: response.data.meta || {},
    };
  }

  async getAssetLayout(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/asset_layouts/${id}`);
    return response.data.asset_layout;
  }

  async getActivityLogs(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/activity_logs', { params: normalizedParams });
    return {
      data: response.data.activity_logs || [],
      meta: response.data.meta || {},
    };
  }

  async getFolders(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/folders', { params: normalizedParams });
    return {
      data: response.data.folders || [],
      meta: response.data.meta || {},
    };
  }

  async getFolder(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/folders/${id}`);
    return response.data.folder;
  }

  async getUsers(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/users', { params: normalizedParams });
    return {
      data: response.data.users || [],
      meta: response.data.meta || {},
    };
  }

  async getUser(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/users/${id}`);
    return response.data.user;
  }

  async getNetworks(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/networks', { params: normalizedParams });
    return {
      data: response.data.networks || [],
      meta: response.data.meta || {},
    };
  }

  async getNetwork(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/networks/${id}`);
    return response.data.network;
  }

  async getProcedures(params: SearchParams = {}): Promise<PaginatedResponse<any>> {
    const normalizedParams = { ...params, ...normalizePaginationParams(params) };
    const response = await this.client.get('/api/v1/procedures', { params: normalizedParams });
    return {
      data: response.data.procedures || [],
      meta: response.data.meta || {},
    };
  }

  async getProcedure(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/procedures/${id}`);
    return response.data.procedure;
  }
}