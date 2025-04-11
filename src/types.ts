import { z } from "zod";

export const SwaggerConfigSchema = z.object({
  swaggerUrl: z.string().url(),
  authKey: z.string().optional(),
});

export type SwaggerConfig = z.infer<typeof SwaggerConfigSchema>;

export const ApiRequestSchema = z.object({
  path: z.string(),
  method: z.string().toUpperCase(),
  parameters: z.record(z.unknown()).optional(),
  body: z.unknown().optional(),
});

export type ApiRequest = z.infer<typeof ApiRequestSchema>; 