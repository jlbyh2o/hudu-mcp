import { z } from 'zod';
import { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

export const GetNetworksSchema = z.object({
  name: z.string().optional(),
  company_id: z.number().optional(),
  location_id: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  archived: z.boolean().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

export const GetNetworkSchema = z.object({
  id: z.number(),
});

export async function handleNetworkTools(
  name: string,
  args: any,
  client: HuduClient
): Promise<any> {
  switch (name) {
    case 'get_networks': {
      const params = GetNetworksSchema.parse(args);
      const result = await client.getNetworks(params);
      return createMcpResponse(result);
    }
    
    case 'get_network': {
      const params = GetNetworkSchema.parse(args);
      const result = await client.getNetwork(params.id);
      return createMcpResponse(result);
    }
    
    default:
      throw new Error(`Unknown network tool: ${name}`);
  }
}