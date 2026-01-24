FROM node:20-alpine AS builder

WORKDIR /app

# Copy root artifacts to support monorepo if needed, or just api specific
# Assuming we are building just the API in the context of the monorepo
# We need to copy the relevant package.jsons. 
# Since this is a monorepo structure, we'll try to keep it simple first
# by assuming we build from the app directory or handle it via a smart context.

# However, standard practice for NestJS in monorepo often involves copying proper configs.
# Let's assume we run this from the root of the repo or we copy everything.

# OPTION 1: Standalone build (simpler for Render if we set Root Directory correctly)
# Copy root artifacts to support monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/
COPY apps/api/src ./apps/api/src/
COPY packages ./packages/

# Install dependencies from root to link workspaces
RUN npm install

# Build the specific app
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

# Environment variables should be injected by Render

EXPOSE 3000

CMD ["node", "dist/main"]
