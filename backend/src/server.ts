import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const { env } = await import('./app.js');

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server listening on ${env.HOST}:${env.PORT}`);
    app.log.info(`Yandex OAuth callback (register this in oauth.yandex.ru): ${env.YANDEX_CALLBACK_URL}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
