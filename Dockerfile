# syntax=docker/dockerfile:1.7
# Single Dockerfile for CI tests and Werf deploy.
#
# CI path (build-push-action --target runtime):
#   base → installer → builder → runtime
#
# Werf path (cached stages linked via dependencies / build-args):
#   apps-base     → target: base
#   apps-deps     → target: werf-installer  (FROM $BASE_IMAGE)
#   apps          → target: werf-runtime    (FROM $BASE_IMAGE, build FROM $DEPS_IMAGE)

ARG REGISTRY=docker.io
# Global defaults required: werf resolves all FROM lines even for unused stages.
# Overridden by werf dependencies imports when building werf-* targets.
ARG BASE_IMAGE=busybox:1.36
ARG DEPS_IMAGE=busybox:1.36

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

# -----------------------------------------------------------------------------
# CI install layer: only package manifests (bin/prune.sh → ./out)
# -----------------------------------------------------------------------------
FROM base AS installer

WORKDIR /app
COPY --chown=app:app ./out /app
COPY --chown=app:app ./.yarn /app/.yarn
COPY --chown=app:app ./.yarnrc.yml /app/.yarnrc.yml
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
	yarn install --immutable --inline-builds

# -----------------------------------------------------------------------------
# CI build + runtime
# -----------------------------------------------------------------------------
FROM base AS builder

ARG TURBO_TEAM
ARG TURBO_TOKEN
ARG TURBO_API
ARG TURBO_REMOTE_ONLY=false

WORKDIR /app
COPY --chown=app:app . /app
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
	&& rm -rf /app/.env \
	&& rm -rf /app/.config /app/.cache /app/.docker \
	&& ls -lah /app/

FROM base AS runtime
USER app:app
WORKDIR /app
COPY --from=builder --chown=app:app /app /app

# -----------------------------------------------------------------------------
# Werf-only stages: reuse published apps-base / apps-deps images via build-args
# (not built by CI --target runtime)
# -----------------------------------------------------------------------------
FROM ${BASE_IMAGE} AS werf-installer

WORKDIR /app
COPY --chown=app:app ./out /app
COPY --chown=app:app ./.yarn /app/.yarn
COPY --chown=app:app ./.yarnrc.yml /app/.yarnrc.yml
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
	yarn install --immutable --inline-builds

FROM ${DEPS_IMAGE} AS werf-builder

ARG TURBO_TEAM
ARG TURBO_TOKEN
ARG TURBO_API
ARG TURBO_REMOTE_ONLY=false

WORKDIR /app
COPY --chown=app:app . /app

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
	&& rm -rf /app/.env \
	&& rm -rf /app/.config /app/.cache /app/.docker \
	&& ls -lah /app/

FROM ${BASE_IMAGE} AS werf-runtime
USER app:app
WORKDIR /app
COPY --from=werf-builder --chown=app:app /app /app
