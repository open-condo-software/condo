FROM buildpack-deps:buster AS base

COPY --from=python:3.8-slim-buster /usr/local/ /usr/local/
COPY --from=node:16-buster-slim /usr/local/ /usr/local/
COPY --from=node:16-buster-slim /opt/ /opt/

RUN set -ex \
	&& groupadd -r app --gid=999 \
	&& useradd --system --create-home --home /app --gid 999 --uid=999 --shell /bin/bash app \
	&& rm -f /usr/local/bin/docker-entrypoint.sh \
	&& yarn set version 3.2.2 \
	&& npm i -g turbo \
	&& python --version \
	&& pip --version \
	&& node --version \
	&& npm --version \
	&& yarn --version \
	&& python3 -m pip install 'psycopg2-binary==2.9.4' && python3 -m pip install 'Django==4.1.2' \
    && echo "OK"

FROM base AS build
USER app:app
WORKDIR /app

RUN echo "# Build time .env config!" >> /app/.env && \
	echo "COOKIE_SECRET=undefined" >> /app/.env && \
	echo "DATABASE_URL=undefined" >> /app/.env && \
	echo "REDIS_URL=undefined" >> /app/.env && \
	echo "NODE_ENV=production" >> /app/.env

COPY --chown=app:app . /app
RUN chmod +x /app/run_condo_domain_tests.sh
RUN chmod +x /app/waitForLocalhostApiReady.sh

RUN \
	--mount=type=cache,target=/app/.yarn/cache,uid=999,gid=999 \
	yarn install --immutable

RUN set -ex \
    && turbo build --filter=condo^... \
    && rm -rf /app/.env  \
    && rm -rf /app/.config /app/.cache /app/.docker  \
    && ls -lah /app/ \
	&& ls -lahtr /app/.yarn/cache