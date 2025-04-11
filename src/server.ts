import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import { SwaggerConfigSchema, ApiRequestSchema } from "./types.js";

if (!process.env.SWAGGER_URL) {
  process.stderr.write("Error: SWAGGER_URL environment variable is required\n");
  process.exit(1);
}

const config = SwaggerConfigSchema.parse({
  swaggerUrl: process.env.SWAGGER_URL,
  authKey: process.env.AUTH_KEY,
});

const server = new McpServer({
  name: "swagger-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {
      "swagger-doc": {
        uri: "swagger://documentation",
        description: "Get the full Swagger documentation"
      },      
    },
    tools: {
      "makeRequest": {
        description: "Make an API request based on the Swagger spec",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            method: { type: "string" },
            parameters: { type: "object", additionalProperties: {} },
            body: {}
          },
          required: ["path", "method"],
          additionalProperties: false
        }
      },
      loadSwaggerDoc: {
        description: "Loads and returns the Swagger documentation",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },
    }
  }
});

let swaggerSpec: any = null;

async function loadSwaggerSpec() {
  if (!swaggerSpec) {
    try {
      const response = await fetch(config.swaggerUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Swagger spec: ${response.statusText}`);
      }
      const spec = await response.json();
      swaggerSpec = spec;
    } catch (error) {
      throw error;
    }
  }
  return swaggerSpec;
}

server.resource(
  "swagger-doc",
  "swagger://documentation",
  async () => {
    try {
      const spec = await loadSwaggerSpec();
      return {
        contents: [{
          uri: "swagger://documentation",
          text: JSON.stringify(spec, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: "swagger://documentation",
          text: `Error loading Swagger documentation: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "loadSwaggerDoc",
  {},
  async () => {
    try {
      const spec = await loadSwaggerSpec();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(spec, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error loading Swagger documentation: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "makeRequest",
  {
    path: z.string(),
    method: z.string().toUpperCase(),
    parameters: z.record(z.unknown()).optional(),
    body: z.unknown().optional(),
  },
  async (args) => {
    try {
      const spec = await loadSwaggerSpec();
      const pathSpec = spec.paths[args.path];
      
      if (!pathSpec) {
        return {
          content: [{
            type: "text",
            text: `Error: Path ${args.path} not found in Swagger spec`
          }],
          isError: true
        };
      }

      const operation = pathSpec[args.method.toLowerCase()];
      if (!operation) {
        return {
          content: [{
            type: "text",
            text: `Error: Method ${args.method} not supported for path ${args.path}`
          }],
          isError: true
        };
      }

      const baseUrl = spec.servers?.[0]?.url || new URL(config.swaggerUrl).origin;
      let url = `${baseUrl}${args.path}`;
      
      if (args.parameters) {
        Object.entries(args.parameters).forEach(([key, value]) => {
          url = url.replace(`{${key}}`, String(value));
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (config.authKey) {
        headers['Authorization'] = `Bearer ${config.authKey}`;
      }

      const response = await fetch(url, {
        method: args.method,
        headers,
        body: args.body ? JSON.stringify(args.body) : undefined
      });

      const responseData = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(responseData, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error making request: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport); 