#!/usr/bin/env node
/**
 * Lobex MCP server (stdio).
 *
 * Env:
 *   LOBEX_API_BASE  default https://lobex.app
 *   LOBEX_API_KEY   rk_live_... (optional if you call register first)
 *
 * Docs: https://lobex.app/#mcp  |  docs/connectors/MCP.md
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLobexMcpServer } from "./server.js";

async function main() {
  const { server } = createLobexMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("lobex-mcp failed:", err);
  process.exit(1);
});
