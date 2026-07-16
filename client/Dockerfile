FROM node:22-alpine AS dependencies
WORKDIR /app/client
RUN corepack enable
COPY client/package.json client/pnpm-lock.yaml client/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
WORKDIR /app
COPY shared ./shared
COPY client ./client
ARG NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
ENV NEXT_PUBLIC_SIGNALING_URL=$NEXT_PUBLIC_SIGNALING_URL
RUN pnpm --dir client build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/client/.next/standalone ./
COPY --from=build /app/client/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
