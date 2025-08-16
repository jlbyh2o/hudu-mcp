import { z } from 'zod';
import { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

export const GetUsersSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  security_level: z.string().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

export const GetUserSchema = z.object({
  id: z.number(),
});

export async function handleUserTools(
  name: string,
  args: any,
  client: HuduClient
): Promise<any> {
  switch (name) {
    case 'get_users': {
      const params = GetUsersSchema.parse(args);
      const result = await client.getUsers(params);
      return createMcpResponse(result);
    }
    
    case 'get_user': {
      const params = GetUserSchema.parse(args);
      const result = await client.getUser(params.id);
      return createMcpResponse(result);
    }
    
    default:
      throw new Error(`Unknown user tool: ${name}`);
  }
}