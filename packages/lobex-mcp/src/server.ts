import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LobexApiClient, type LobexClientOptions } from "./client.js";
import { LOBEX_MCP_TOOLS } from "./tools.js";

export function createLobexMcpServer(opts: LobexClientOptions = {}) {
  const client = new LobexApiClient(opts);

  const server = new Server(
    {
      name: "lobex",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: LOBEX_MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      annotations: {
        // MCP clients that surface annotations can group by title/module.
        title: `${t.module === "buy" ? "Buy" : t.module === "sell" ? "Sell" : "Shared"}: ${t.name}`,
        readOnlyHint:
          t.name === "search_services" ||
          t.name === "whoami" ||
          t.name === "wallet" ||
          t.name === "list_orders" ||
          t.name === "get_purchase" ||
          t.name === "get_delivery" ||
          t.name === "list_messages",
        destructiveHint:
          t.name === "purchase_service" ||
          t.name === "confirm_delivery" ||
          t.name === "request_refund" ||
          t.name === "request_cashout",
        openWorldHint: true,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    const tool = LOBEX_MCP_TOOLS.find((t) => t.name === name);

    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Unknown tool: ${name}` }),
          },
        ],
      };
    }

    if (tool.auth && !client.getApiKey() && name !== "register") {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error:
                "Missing LOBEX_API_KEY. Set env LOBEX_API_KEY=rk_live_... or call register first.",
              hint: "https://lobex.app/#mcp",
            }),
          },
        ],
      };
    }

    try {
      const result = await client.callTool(name, args);
      const text = JSON.stringify(result.data, null, 2);
      return {
        isError: !result.ok,
        content: [{ type: "text" as const, text }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: message }),
          },
        ],
      };
    }
  });

  return { server, client };
}
