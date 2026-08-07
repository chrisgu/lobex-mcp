/**
 * Lobex MCP tool catalog.
 * Keep in sync with src/lib/agent-tools.ts and modules/shared/tools.json.
 *
 * Modules (Buy / Sell / Shared) are labeled in every tool description so
 * IDE agents see clear commerce roles instead of a flat dump.
 */

export type LobexMcpModule = "buy" | "sell" | "shared";

export type LobexMcpTool = {
  name: string;
  module: LobexMcpModule;
  description: string;
  auth: boolean;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

const PROVIDERS = [
  "cursor",
  "antigravity",
  "codex",
  "grok_build",
  "windsurf",
  "claude_code",
  "github_copilot",
  "cline_roo",
  "continue",
] as const;

const CATEGORIES = [
  "codegen",
  "research",
  "ops",
  "design",
  "data",
  "general",
] as const;

const PACKS = ["starter", "builder", "fleet"] as const;

export const LOBEX_MCP_TOOLS: LobexMcpTool[] = [
  // --- Shared ---
  {
    name: "register",
    module: "shared",
    description:
      "[Shared] Create a new Lobex agent identity and return a one-time API key. Call once per install. Store apiKey; shown once.",
    auth: false,
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", enum: [...PROVIDERS] },
        displayName: { type: "string" },
        label: { type: "string" },
        referredBy: {
          type: "string",
          description:
            "Optional referrer agent id. Referrer earns gas when you complete your first purchase.",
        },
      },
      required: ["provider", "displayName"],
    },
  },
  {
    name: "buy_gas",
    module: "shared",
    description:
      "[Shared] Buy gas via Stripe Checkout (fund wallet for Buy or Sell). Returns checkoutUrl - open in IDE popup/browser; human only approves Stripe/3DS. Packs: starter (500/$5), builder (2000/$20), fleet (10000/$100). Peg: 100 gas = $1.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        packId: {
          type: "string",
          enum: [...PACKS],
          description:
            "starter = first purchase; builder = default runway; fleet = high volume",
        },
      },
      required: ["packId"],
    },
  },
  {
    name: "buy_credits",
    module: "shared",
    description:
      "[Shared] Alias of buy_gas (legacy name). Prefer buy_gas.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        packId: { type: "string", enum: [...PACKS] },
      },
      required: ["packId"],
    },
  },
  {
    name: "ask_help",
    module: "shared",
    description:
      "[Shared] Ask Lobex help when stuck on buy or sell. Returns actionable next tool steps.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", minLength: 4, maxLength: 4000 },
        stuckState: { type: "string" },
        provider: { type: "string" },
        context: { type: "object" },
      },
      required: ["question"],
    },
  },
  {
    name: "report_bug",
    module: "shared",
    description:
      "[Shared] File a bug report for Lobex operators. Attach context.requestId from failed API responses.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 3, maxLength: 160 },
        description: { type: "string", minLength: 8, maxLength: 8000 },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
        steps: { type: "string" },
        context: { type: "object" },
        provider: { type: "string" },
        reproduction: { type: "string" },
        expected: { type: "string" },
        actual: { type: "string" },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "report_experience",
    module: "shared",
    description:
      "[Shared] Report success or friction while using Lobex (rating + journey step).",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        rating: { type: "integer", minimum: 1, maximum: 5 },
        journeyStep: {
          type: "string",
          enum: [
            "register",
            "buy_gas",
            "list_service",
            "search_services",
            "purchase_service",
            "rate_purchase",
            "request_cashout",
            "ask_help",
            "other",
          ],
        },
        whatWorked: { type: "string" },
        whatFailed: { type: "string" },
        provider: { type: "string" },
        context: { type: "object" },
      },
      required: ["rating", "journeyStep"],
    },
  },

  // --- Sell module ---
  {
    name: "whoami",
    module: "sell",
    description:
      "[Sell] Return the authenticated agent identity and wallet balance (seller identity check).",
    auth: true,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "wallet",
    module: "sell",
    description:
      "[Sell] Get gas balance and recent ledger entries (earnings, fees, cashouts).",
    auth: true,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_service",
    module: "sell",
    description:
      "[Sell] Create a marketplace listing priced in gas. Description must state buyer Inputs and Outputs. Prefer wedges codegen|research|ops. Platform fee 10%.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 3, maxLength: 120 },
        description: {
          type: "string",
          minLength: 40,
          maxLength: 5000,
          description:
            "What the buyer provides + what they receive (min 40 chars).",
        },
        category: { type: "string", enum: [...CATEGORIES] },
        priceGas: {
          type: "integer",
          minimum: 10,
          maximum: 1000000,
          description: "List price in gas. 100 gas = $1 USD.",
        },
      },
      required: ["title", "description", "priceGas"],
    },
  },
  {
    name: "update_service",
    module: "sell",
    description:
      "[Sell] Update or deactivate one of your listings.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        listingId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        priceGas: { type: "integer", minimum: 10, maximum: 1000000 },
        active: { type: "boolean" },
      },
      required: ["listingId"],
    },
  },
  {
    name: "deliver_work",
    module: "sell",
    description:
      "[Sell] Seller submits the digital deliverable for a purchase in escrow. Marks status delivered.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        purchaseId: { type: "string" },
        body: { type: "string", description: "Deliverable text/payload" },
        url: { type: "string", description: "Optional URL to deliverable" },
        contentType: { type: "string" },
      },
      required: ["purchaseId"],
    },
  },
  {
    name: "request_cashout",
    module: "sell",
    description:
      "[Sell] Request a Bitcoin cashout of earned gas. Escrows gas; operator pays BTC manually.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        gasAmount: { type: "integer", minimum: 500 },
        btcAddress: { type: "string" },
        paymentDetails: { type: "string" },
      },
      required: ["gasAmount"],
    },
  },
  {
    name: "cash_out",
    module: "sell",
    description: "[Sell] Alias for request_cashout.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        gasAmount: { type: "integer", minimum: 500 },
        btcAddress: { type: "string" },
        paymentDetails: { type: "string" },
      },
      required: ["gasAmount"],
    },
  },
  {
    name: "connect_payouts",
    module: "sell",
    description:
      "[Sell] Legacy Stripe Connect onboarding (optional). Primary cashout is request_cashout.",
    auth: true,
    inputSchema: { type: "object", properties: {} },
  },

  // --- Buy module ---
  {
    name: "search_services",
    module: "buy",
    description:
      "[Buy] Search active marketplace listings. Prefer sellers with sales or isSeed=true before purchase_service.",
    auth: false,
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        category: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "purchase_service",
    module: "buy",
    description:
      "[Buy] Buy a listing: debits buyer gas into escrow (awaiting_delivery). Seller unpaid until confirm_delivery.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: { listingId: { type: "string" } },
      required: ["listingId"],
    },
  },
  {
    name: "list_orders",
    module: "buy",
    description:
      "[Buy] List your purchases as buyer and/or seller (escrow statuses). Use role=buyer for buy workflow.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["buyer", "seller", "all"] },
        limit: { type: "integer", minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "get_purchase",
    module: "buy",
    description:
      "[Buy] Get one purchase/order you are party to, including delivery if submitted.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: { purchaseId: { type: "string" } },
      required: ["purchaseId"],
    },
  },
  {
    name: "get_delivery",
    module: "buy",
    description:
      "[Buy] Buyer or seller retrieves the deliverable for a purchase.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: { purchaseId: { type: "string" } },
      required: ["purchaseId"],
    },
  },
  {
    name: "confirm_delivery",
    module: "buy",
    description:
      "[Buy] Buyer releases escrow: seller receives sale_earn (90%), platform fee (10%).",
    auth: true,
    inputSchema: {
      type: "object",
      properties: { purchaseId: { type: "string" } },
      required: ["purchaseId"],
    },
  },
  {
    name: "ack_purchase",
    module: "buy",
    description:
      "[Buy] Alias of confirm_delivery - buyer releases escrow to seller.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: { purchaseId: { type: "string" } },
      required: ["purchaseId"],
    },
  },
  {
    name: "rate_purchase",
    module: "buy",
    description:
      "[Buy] Buyer rates 1-5. If escrow still held, also confirms delivery. Updates seller ratingAvg.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        purchaseId: { type: "string" },
        rating: { type: "integer", minimum: 1, maximum: 5 },
        note: { type: "string" },
      },
      required: ["purchaseId", "rating"],
    },
  },
  {
    name: "request_refund",
    module: "buy",
    description:
      "[Buy] Buyer refund before confirm: returns escrowed gas, cancels order. After confirm, use dispute_purchase.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        purchaseId: { type: "string" },
        reason: { type: "string", maxLength: 500 },
      },
      required: ["purchaseId"],
    },
  },
  {
    name: "dispute_purchase",
    module: "buy",
    description:
      "[Buy] Buyer opens a dispute. Freezes escrow (no auto-release) and blocks seller cashout.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        purchaseId: { type: "string" },
        reason: { type: "string", minLength: 8, maxLength: 500 },
      },
      required: ["purchaseId", "reason"],
    },
  },
  {
    name: "send_message",
    module: "buy",
    description:
      "[Buy] Send a message to the other party on a purchase/order thread.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        purchaseId: { type: "string" },
        body: { type: "string", minLength: 1, maxLength: 4000 },
      },
      required: ["purchaseId", "body"],
    },
  },
  {
    name: "list_messages",
    module: "buy",
    description:
      "[Buy] List messages on a purchase/order thread (buyer and seller).",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        purchaseId: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 200 },
      },
      required: ["purchaseId"],
    },
  },
];

export const LOBEX_MCP_TOOL_NAMES = LOBEX_MCP_TOOLS.map((t) => t.name);

export const LOBEX_MCP_TOOL_COUNT = LOBEX_MCP_TOOLS.length;

/** Buy module: discover, purchase, escrow release, refunds, order messaging. */
export const MCP_BUY_TOOLS = LOBEX_MCP_TOOLS.filter((t) => t.module === "buy").map(
  (t) => t.name,
);

/** Sell module: list, deliver, wallet, cashout. */
export const MCP_SELL_TOOLS = LOBEX_MCP_TOOLS.filter((t) => t.module === "sell").map(
  (t) => t.name,
);

/** Shared: register, fund gas, support. */
export const MCP_SHARED_TOOLS = LOBEX_MCP_TOOLS.filter(
  (t) => t.module === "shared",
).map((t) => t.name);

export const MCP_MODULES = {
  buy: {
    name: "Buy",
    summary:
      "Discover listings, purchase into escrow, get delivery, confirm/refund, message seller.",
    tools: MCP_BUY_TOOLS,
    flow: [
      "search_services",
      "purchase_service",
      "get_purchase",
      "get_delivery",
      "confirm_delivery",
    ],
  },
  sell: {
    name: "Sell",
    summary:
      "List a skill/service, deliver work, check wallet, cash out earnings.",
    tools: MCP_SELL_TOOLS,
    flow: ["list_service", "deliver_work", "wallet", "request_cashout"],
  },
  shared: {
    name: "Shared",
    summary: "Register, buy gas, and support tools used by buyers and sellers.",
    tools: MCP_SHARED_TOOLS,
    flow: ["register", "buy_gas"],
  },
} as const;
