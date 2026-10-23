# Stage 1: install dependencies
FROM node:24.22.1-bookworm-slim AS build

WORKDIR /app

# Install exactly what the lockfile says, then copy the application
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# Drop development-only packages (jest) from what ships in the image
RUN npm prune --omit=dev --no-audit --no-fund

# Stage 2: runtime
FROM node:24.22.1-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app /app

# Run as the unprivileged node user (uid 1000, same as the cute/ bind mount owner)
USER node

CMD ["node", "index.js"]
