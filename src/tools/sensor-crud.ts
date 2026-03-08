import { z } from 'zod';
import { createSensor, updateSensor, deleteSensor } from '../rest/platform.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const CreateSensorInput = z.object({
  name: z.string().describe('Sensor name'),
  description: z.string().optional().describe('Sensor description'),
  category: z.string().optional().describe('Sensor category'),
  content_set_name: z.string().optional().describe('Content set name'),
  script: z.string().optional().describe('Sensor script'),
  script_type: z.string().optional().describe('Script type (e.g., VBScript, PowerShell, BashScript)'),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    label: z.string().optional(),
    default_value: z.string().optional(),
  })).optional().describe('Sensor parameters'),
});

export const UpdateSensorInput = z.object({
  id: z.string().describe('Sensor ID'),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  script: z.string().optional(),
});

export const DeleteSensorInput = z.object({
  id: z.string().describe('Sensor ID'),
});

export async function createSensorHandler(
  input: z.infer<typeof CreateSensorInput>
): Promise<ToolOutput<unknown>> {
  try {
    const body = {
      name: input.name,
      description: input.description,
      category: input.category,
      content_set: input.content_set_name ? { name: input.content_set_name } : undefined,
      script: input.script,
      script_type: input.script_type,
      parameters: input.parameters,
    };
    const result = await createSensor(body);
    return { success: true, data: { sensor: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function updateSensorHandler(
  input: z.infer<typeof UpdateSensorInput>
): Promise<ToolOutput<unknown>> {
  try {
    const body = {
      name: input.name,
      description: input.description,
      category: input.category,
      script: input.script,
    };
    const result = await updateSensor(input.id, body);
    return { success: true, data: { sensor: result } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function deleteSensorHandler(
  input: z.infer<typeof DeleteSensorInput>
): Promise<ToolOutput<unknown>> {
  try {
    await deleteSensor(input.id);
    return { success: true, data: { deleted: true, id: input.id } };
  } catch (err) {
    return handleToolError(err);
  }
}
