FROM buildpack-deps:buster AS base

COPY --from=python:3.8-buster /usr/local/ /usr/local/
COPY --from=node:16-buster /usr/local/ /usr/local/
COPY --from=node:16-buster /opt/ /opt/

# Add app user/group! Clean packages and fix links! Check version! And install some extra packages!
RUN set -ex \
	&& groupadd -r app --gid=999 \
	&& useradd --system --create-home --home /app --gid 999 --uid=999 --shell /bin/bash app \
	&& rm -f /usr/local/bin/docker-entrypoint.sh \
	&& python --version \
	&& pip --version \
	&& node --version \
	&& yarn --version \
	&& python3 -m pip install 'psycopg2-binary==2.9.4' && python3 -m pip install 'Django==4.1.2' \
    && echo "OK"

# Build container
FROM base AS build
USER app:app
WORKDIR /app

RUN echo "# Build time .env config!" >> /app/.env && \
	echo "COOKIE_SECRET=undefined" >> /app/.env && \
	echo "DATABASE_URL=undefined" >> /app/.env && \
	echo "REDIS_URL=undefined" >> /app/.env && \
	echo "FILE_FIELD_ADAPTER=local" >> /app/.env && \
	echo "NEXT_TELEMETRY_DISABLED=1" >> /app/.env && \
	echo "NODE_ENV=production" >> /app/.env

COPY --chown=app:app . /app
RUN yarn install --immutable

# yarn workspaces foreach -pt run build
RUN set -ex \
    && yarn build \
    && rm -rf /app/.env  \
    && rm -rf /app/.config /app/.cache /app/.docker  \
    && ls -lah /app/

# Runtime container
FROM base
USER app:app
WORKDIR /app
COPY --from=build --chown=root:root /app /app
