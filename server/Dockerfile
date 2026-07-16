FROM node:22-alpine AS build
WORKDIR /app/server
RUN corepack enable
COPY server/package.json server/pnpm-lock.yaml server/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
WORKDIR /app
COPY shared ./shared
COPY server/src ./server/src
COPY server/tsconfig.json ./server/tsconfig.json
RUN pnpm --dir server build && pnpm --dir server prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/server/dist ./dist
EXPOSE 3001
CMD ["node", "dist/server/src/index.js"]
