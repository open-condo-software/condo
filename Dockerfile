# syntax=docker/dockerfile:1.7

ARG REGISTRY=docker.io
ARG NODE_VERSION=24
ARG PYTHON_VERSION=3.12
ARG APP_USER=app
ARG APP_UID=10001

############################
# Base image
############################
FROM ${REGISTRY}/node:${NODE_VERSION}-bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    curl \
    git \
 && rm -rf /var/lib/apt/lists/*

############################
# Python deps
############################
FROM base AS python-deps

WORKDIR /tmp

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

############################
# Node deps
############################
FROM base AS node-deps

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable

############################
# Builder
############################
FROM base AS builder

WORKDIR /app

COPY --from=node-deps /app /app

COPY . .

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn build

############################
# Runtime (minimal)
############################
FROM ${REGISTRY}/node:${NODE_VERSION}-bookworm-slim AS runtime

ARG APP_USER
ARG APP_UID

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1

RUN useradd --system \
    --uid ${APP_UID} \
    --create-home \
    --home-dir /app \
    ${APP_USER}

WORKDIR /app

COPY --from=builder /app /app
COPY --from=python-deps /usr/local/lib/python3* /usr/local/lib/

RUN chown -R ${APP_USER}:${APP_USER} /app

USER ${APP_USER}

############################
# Healthcheck
############################
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
 CMD node healthcheck.js || exit 1

############################
# Start
############################
EXPOSE 3000

CMD ["node", "server.js"]
