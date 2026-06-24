import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';

export function zodToOpenApiSchema(schema: ZodTypeAny) {
  const json = zodToJsonSchema(schema, { $refStrategy: 'none' }) as Record<string, unknown>;
  const { $schema, definitions, ...rest } = json;
  return rest;
}

export function zodSchemasToComponents(schemas: Record<string, ZodTypeAny>) {
  return Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, zodToOpenApiSchema(schema)]),
  );
}
