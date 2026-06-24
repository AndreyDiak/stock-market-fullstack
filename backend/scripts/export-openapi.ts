import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

config();

function rewriteRefs(value: unknown, defMap: Record<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteRefs(item, defMap));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (typeof record.$ref === 'string') {
      const match = record.$ref.match(/^#\/components\/schemas\/(def-\d+)$/);
      if (match && defMap[match[1]]) {
        return { $ref: `#/components/schemas/${defMap[match[1]]}` };
      }
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, rewriteRefs(item, defMap)]),
    );
  }

  return value;
}

async function exportOpenApi() {
  const { buildApp } = await import('../src/app.js');
  const { fastifyDefMap, openApiComponentSchemas } = await import('../src/schemas/register.js');

  const app = await buildApp({ openapiExport: true });
  await app.ready();

  const rawSpec = app.swagger() as {
    components?: Record<string, unknown>;
    paths?: Record<string, unknown>;
  };

  const spec = rewriteRefs(rawSpec, fastifyDefMap) as typeof rawSpec;

  spec.components = {
    ...spec.components,
    schemas: openApiComponentSchemas,
  };

  const outputPath = resolve(process.cwd(), '../openapi.json');
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`OpenAPI spec written to ${outputPath}`);

  await app.close();
}

exportOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
