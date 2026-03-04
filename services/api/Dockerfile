ARG NODE_VERSION=22.18.0
ARG PNPM_VERSION=10.24.0

# ==== Builder Stage ====
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy workspace config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json and lockfile for each package (sharedWorkspaceLockfile: false)
COPY packages/errors/package.json packages/errors/pnpm-lock.yaml ./packages/errors/
COPY packages/dayjs/package.json packages/dayjs/pnpm-lock.yaml ./packages/dayjs/
COPY packages/logger/package.json packages/logger/pnpm-lock.yaml ./packages/logger/
COPY services/api/package.json services/api/pnpm-lock.yaml ./services/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY services/api/ ./services/api/

# Build packages
RUN pnpm --filter @my-app/errors build && \
    pnpm --filter @my-app/dayjs build && \
    pnpm --filter @my-app/logger build

# Build services/api
RUN pnpm --filter api build

# Use tini for PID 1 signal handling
ENV TINI_VERSION=v0.19.0
RUN wget -O /tini https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static && \
    chmod +x /tini

# ==== Production Dependencies Stage ====
# Use pnpm deploy to extract only production dependencies (completely exclude devDependencies)
FROM builder AS prod-deps

# Extract only production dependencies for the api package to /prod via pnpm deploy
# --ignore-scripts skips post-install scripts
RUN pnpm --filter api deploy --prod /prod --ignore-scripts

# Remove drizzle-kit related dev dependencies (included as optional peerDependency of better-auth)
# These are not used at runtime
RUN rm -rf /prod/node_modules/.pnpm/@esbuild* \
    /prod/node_modules/.pnpm/esbuild@* \
    /prod/node_modules/.pnpm/esbuild-register* \
    /prod/node_modules/.pnpm/drizzle-kit* \
    /prod/node_modules/.pnpm/@drizzle-team* \
    /prod/node_modules/.pnpm/@esbuild-kit* \
    /prod/node_modules/.pnpm/vitest* \
    /prod/node_modules/.pnpm/vite@* \
    /prod/node_modules/.pnpm/tsx@* \
    /prod/node_modules/.bin/esbuild \
    2>/dev/null || true

# ==== API Target ====
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS api

WORKDIR /app

# Copy production dependencies and build artifacts extracted by pnpm deploy
COPY --from=prod-deps /prod/node_modules ./node_modules
COPY --from=prod-deps /prod/package.json ./
COPY --from=builder /app/services/api/dist ./dist
COPY --from=builder /tini /tini

ENV NODE_ENV=production \
    TZ=UTC

EXPOSE 4001

ENTRYPOINT ["/tini", "--"]
CMD ["/nodejs/bin/node", "dist/cmd/index.js"]

# ==== Test Target ====
FROM node:${NODE_VERSION}-alpine AS test

WORKDIR /app

RUN npm install -g pnpm@${PNPM_VERSION}

# Copy dependencies and built packages from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/api ./services/api
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./

ENV NODE_ENV=test

USER node

CMD ["pnpm", "--filter", "api", "test:run"]

# ==== Dev Target ====
FROM node:${NODE_VERSION}-alpine AS dev

WORKDIR /app

RUN npm install -g pnpm@${PNPM_VERSION}

# Copy dependencies and built packages from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Also copy node_modules for api
COPY --from=builder /app/services/api/node_modules ./services/api/node_modules
COPY --from=builder /app/services/api/package.json ./services/api/

WORKDIR /app/services/api

ENV NODE_ENV=development

USER node

# Source code will be overwritten by bind mount
CMD ["pnpm", "dev"]
