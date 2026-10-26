# syntax=docker/dockerfile:1
# caddy image (T-007): the built SPA and the Caddyfile. Build context: the repository root
# (see /.dockerignore). Base images are pinned by digest; Dependabot updates them.

FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=true
RUN corepack enable
WORKDIR /src
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

FROM caddy:2-alpine@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv/web
