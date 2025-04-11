# MCP Swagger Server

An MCP server that provides access to Swagger/OpenAPI documentation and allows making API requests based on the specification.

## Features

- Loads Swagger documentation from a URL
- Makes API requests based on the Swagger spec
- Supports authentication via API key
- Caches Swagger spec for better performance
- Validates requests against the Swagger spec

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Running Locally

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run start
```

## Configuration

The server requires the following environment variables:

- `SWAGGER_URL`: URL to the Swagger specification (required)
- `AUTH_KEY`: Authentication key for API requests (optional)

## Available Resources and Tools

### Resource: `swagger-doc`
- URI: `swagger://documentation`
- Description: Get the full Swagger documentation

### Tool: `makeRequest`
Make API requests based on the Swagger spec.

Parameters:
- `path`: The API endpoint path
- `method`: HTTP method (GET, POST, etc.)
- `parameters`: Optional path/query parameters
- `body`: Optional request body

Example:
```typescript
const result = await mcp.tools.makeRequest({
  path: "/api/users",
  method: "GET",
  parameters: { userId: "123" }
});
```

## Smithery.ai Deployment

This server is configured for deployment on Smithery.ai. The deployment requires:

1. A `Dockerfile` that builds and runs the server
2. A `smithery.yaml` configuration file
3. Proper TypeScript build setup

### Configuration Schema

When deploying on Smithery.ai, configure the server with:

```json
{
  "swaggerUrl": "https://api.example.com/swagger.json",
  "authKey": "your-api-key"  // Optional
}
```

### Local Testing with Smithery

1. Build the Docker image:
```bash
docker build -t mcp-swagger .
```

2. Run the container:
```bash
docker run -e SWAGGER_URL=your-swagger-url -e AUTH_KEY=your-auth-key mcp-swagger
```

## Development

### Scripts

- `npm run build`: Build TypeScript code
- `npm run start`: Run the server in production mode
- `npm run dev`: Run the server in development mode with hot reloading