import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import config from './config.js';
import { initAuth } from './http/auth.js';
import { initHttpsAgent } from './http/client.js';
import { warmCache } from './cache/manager.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  // Initialize TLS agent (must be done before any HTTP requests)
  initHttpsAgent(config);

  // Initialize auth with the API token
  initAuth(config.apiToken, config.graphqlUrl);

  // Warm the sensor/package cache (runs in background; degraded mode on failure)
  warmCache().catch(() => {
    // warmCache handles its own error logging and retry
  });

  // Build and start the MCP server
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[tanium-mcp] Server started on stdio transport');
}

main().catch((err) => {
  console.error('[tanium-mcp] Fatal error:', err);
  process.exit(1);
});
