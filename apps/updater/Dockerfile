FROM node:20-trixie-slim AS base

FROM base AS builder
WORKDIR /app
RUN npm install turbo --global
COPY . .
RUN turbo prune @sr24/updater --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN npm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only the compiled files and dependencies
COPY --from=installer /app .

RUN chmod +x node_modules/7zip-bin/linux/x64/7za

CMD ["node", "apps/updater/dist/index.js"]
