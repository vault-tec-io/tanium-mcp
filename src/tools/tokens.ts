import { z } from 'zod';
import { execute } from '../graphql/client.js';
import { MY_API_TOKENS_QUERY } from '../graphql/queries/tokens.js';
import { API_TOKEN_GRANT_MUTATION, API_TOKEN_REVOKE_MUTATION, API_TOKEN_ROTATE_MUTATION } from '../graphql/mutations/tokens.js';
import { handleToolError } from '../errors/mcp.js';
import type { ToolOutput } from '../types/rest.js';

export const GrantAPITokenInput = z.object({
  notes: z.string().optional().describe('Purpose/usage notes for the token'),
  expires_in_days: z.number().int().optional().describe('Days until expiry (default: server default)'),
  persona_name: z.string().optional().describe('Persona name for the token'),
  trusted_ip_addresses: z.array(z.string()).default([]).describe('CIDR-format trusted IPs'),
});

export const RevokeAPITokenInput = z.object({
  token_id: z.string().describe('Token ID to revoke'),
});

export const RotateAPITokenInput = z.object({
  token_string: z.string().describe('Token string to rotate (this server\'s own rotation is handled internally)'),
});

export async function listAPITokens(): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      myAPITokens: { error?: { message: string }; tokens?: unknown[] };
    }>(MY_API_TOKENS_QUERY);

    const payload = result.data.myAPITokens;
    if (payload.error) {
      return { success: false, error: { code: 'QUERY_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { tokens: payload.tokens ?? [] } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function grantAPIToken(
  input: z.infer<typeof GrantAPITokenInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      apiTokenGrant: { error?: { message: string }; token?: unknown };
    }>(API_TOKEN_GRANT_MUTATION, {
      input: {
        notes: input.notes,
        expiresInDays: input.expires_in_days,
        personaName: input.persona_name,
        trustedIPAddresses: input.trusted_ip_addresses,
      },
    });

    const payload = result.data.apiTokenGrant;
    if (payload.error) {
      return { success: false, error: { code: 'GRANT_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { token: payload.token } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function revokeAPIToken(
  input: z.infer<typeof RevokeAPITokenInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      apiTokenRevoke: { error?: { message: string } };
    }>(API_TOKEN_REVOKE_MUTATION, { id: input.token_id });

    const payload = result.data.apiTokenRevoke;
    if (payload.error) {
      return { success: false, error: { code: 'REVOKE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { revoked: true, id: input.token_id } };
  } catch (err) {
    return handleToolError(err);
  }
}

export async function rotateAPIToken(
  input: z.infer<typeof RotateAPITokenInput>
): Promise<ToolOutput<unknown>> {
  try {
    const result = await execute<{
      apiTokenRotate: { error?: { message: string }; token?: unknown };
    }>(API_TOKEN_ROTATE_MUTATION, { tokenString: input.token_string });

    const payload = result.data.apiTokenRotate;
    if (payload.error) {
      return { success: false, error: { code: 'ROTATE_ERROR', message: payload.error.message } };
    }
    return { success: true, data: { token: payload.token } };
  } catch (err) {
    return handleToolError(err);
  }
}
