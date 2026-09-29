#!/usr/bin/env node
/**
 * GEAR MCP server (stdio transport).
 *
 * Exposes GEAR data-access tools (see ./gear-tools.js) over the Model Context
 * Protocol so AI clients such as VS Code agent mode or Claude Desktop can query
 * the GEAR portal's data. The same tool layer is reused by the web chatbot's
 * /api/chat orchestrator.
 *
 * Transport: stdio. Start it via `node mcp/gear-mcp-server.js` or through the
 * .vscode/mcp.json configuration.
 *
 * The GEAR API must be reachable at GEAR_API_BASE (defaults to
 * http://localhost:<PORT>/api). Start the GEAR server (`npm run serve-api`)
 * before using this MCP server.
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const { tools, runTool } = require('./gear-tools');

/** Convert a JSON-schema "parameters" object into a Zod raw-shape for the SDK. */
function jsonSchemaToZodShape(parameters) {
  const shape = {};
  const props = (parameters && parameters.properties) || {};
  const required = new Set((parameters && parameters.required) || []);

  for (const [key, def] of Object.entries(props)) {
    let field;
    switch (def.type) {
      case 'number':
        field = z.number();
        break;
      case 'boolean':
        field = z.boolean();
        break;
      case 'string':
      default:
        field = def.enum ? z.enum(def.enum) : z.string();
        break;
    }
    if (def.description) field = field.describe(def.description);
    if (!required.has(key)) field = field.optional();
    shape[key] = field;
  }
  return shape;
}

async function main() {
  const server = new McpServer({
    name: 'gear-mcp-server',
    version: '1.0.0',
  });

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      jsonSchemaToZodShape(tool.parameters),
      async (args) => {
        try {
          const result = await runTool(tool.name, args);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          return {
            isError: true,
            content: [
              { type: 'text', text: `Error running ${tool.name}: ${err.message}` },
            ],
          };
        }
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is reserved for the MCP protocol; log to stderr only.
  console.error('[gear-mcp-server] connected over stdio');
}

main().catch((err) => {
  console.error('[gear-mcp-server] fatal error:', err);
  process.exit(1);
});
