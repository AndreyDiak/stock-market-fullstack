FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL=postgresql://stock_user:stock_password@postgres:5432/stock_simulator?schema=public
RUN npx prisma generate

FROM base AS development

COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

FROM base AS builder

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npx tsc-alias@1.8.10 -p tsconfig.json

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
