import { z } from 'zod';
import type { HuduClient } from '../hudu-client.js';
import { createMcpResponse } from '../utils/response-utils.js';

const GetProceduresSchema = z.object({
  name: z.string().optional(),
  company_id: z.number().optional(),
  global_template: z.enum(['true', 'false']).optional(),
  company_template: z.number().optional(),
  parent_procedure_id: z.number().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

const GetProcedureSchema = z.object({
  id: z.number(),
});

export async function handleProcedureTools(
  toolName: string,
  args: any,
  client: HuduClient,
): Promise<any> {
  switch (toolName) {
    case 'get_procedures': {
      const params = GetProceduresSchema.parse(args);
      const result = await client.getProcedures(params);
      return createMcpResponse(result);
    }
    case 'get_procedure': {
      const { id } = GetProcedureSchema.parse(args);
      const result = await client.getProcedure(id);
      return createMcpResponse(result);
    }
    default:
      throw new Error(`Unknown procedure tool: ${toolName}`);
  }
}