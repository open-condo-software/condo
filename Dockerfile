# syntax=docker/dockerfile:1.7
ARG REGISTRY=docker.io

FROM ${REGISTRY}/python:3.14-slim-bookworm AS python
FROM ${REGISTRY}/node:24-bookworm-slim AS node

FROM ${REGISTRY}/buildpack-deps:bookworm AS base

COPY --from=python /usr/local/ /usr/local/
COPY --from=node /usr/local/ /usr/local/
COPY --from=node /opt/ /opt/

ENV LANG=C.UTF-8 \
	NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	TURBO_TELEMETRY_DISABLED=1

# Add app user/group! Clean packages and fix links! Check version! And install some extra packages!
RUN set -ex \
	&& groupadd -r app --gid=999 \
	&& useradd --system --create-home --home /app --gid 999 --uid=999 --shell /bin/bash app \
	&& rm -f /usr/local/bin/docker-entrypoint.sh \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends libjemalloc2 \
	&& rm -rf /var/lib/apt/lists/* \
	&& python --version \
	&& pip --version \
	&& node --version \
	&& yarn --version \
	&& python3 -m pip install 'psycopg2-binary==2.9.10' && python3 -m pip install 'Django==5.2' \
	&& echo "OK"

# Installer
# NOTE: werf's Dockerfile parser does not support COPY --parents, so we copy the
# context and keep only package manifests before yarn install (no prune.sh / out/).
FROM base AS installer

WORKDIR /tmp/src
COPY --chown=app:app . .
RUN set -ex \
	&& mkdir -p /app \
	&& find . \( -name package.json -o -name yarn.lock \) \
		-not -path '*/node_modules/*' \
		-not -path './out/*' \
	| while read -r f; do \
		mkdir -p "/app/$(dirname "$f")" \
		&& cp "$f" "/app/$f"; \
	done \
	&& cp -a .yarn /app/.yarn \
	&& cp .yarnrc.yml /app/ \
	&& rm -rf /tmp/src

WORKDIR /app
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
	yarn install --immutable --inline-builds

# Builder
FROM base AS builder

ARG TURBO_TEAM
ARG TURBO_TOKEN
ARG TURBO_API
ARG TURBO_REMOTE_ONLY=false

WORKDIR /app
# Copy entire repo
COPY --chown=app:app . /app
# Copy previously installed packages
COPY --from=installer --chown=app:app /app /app

ENV TURBO_TEAM=$TURBO_TEAM
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TURBO_API=$TURBO_API
ENV TURBO_REMOTE_ONLY=$TURBO_REMOTE_ONLY

RUN echo "# Build time .env config!" >> /app/.env && \
	echo "COOKIE_SECRET=undefined" >> /app/.env && \
	echo "DATABASE_URL=undefined" >> /app/.env && \
	echo "REDIS_URL=undefined" >> /app/.env && \
	echo "FILE_FIELD_ADAPTER=local" >> /app/.env && \
	echo "NEXT_TELEMETRY_DISABLED=1" >> /app/.env && \
	echo "NODE_ENV=production" >> /app/.env

RUN chmod +x ./bin/run_condo_domain_tests.sh

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
	--mount=type=cache,target=/app/.turbo \
	set -ex \
	&& yarn build \
	&& rm -rf /app/out \
	&& rm -rf /app/.env  \
	&& rm -rf /app/.config /app/.cache /app/.docker  \
	&& ls -lah /app/

# Runtime container
FROM base
USER app:app
WORKDIR /app
COPY --from=builder --chown=app:app /app /app
