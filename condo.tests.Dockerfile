# base
FROM swr.ru-moscow-1.hc.sbercloud.ru/doma/utils/buildpack-deps:buster AS base

COPY --from=swr.ru-moscow-1.hc.sbercloud.ru/doma/utils/python:3.8-slim-buster /usr/local/ /usr/local/
COPY --from=swr.ru-moscow-1.hc.sbercloud.ru/doma/utils/node:16-buster-slim /usr/local/ /usr/local/
COPY --from=swr.ru-moscow-1.hc.sbercloud.ru/doma/utils/node:16-buster-slim /opt/ /opt/

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

# build
FROM base AS build
WORKDIR /app
RUN echo "# Build time .env config!" >> /app/.env && \
	echo "COOKIE_SECRET=undefined" >> /app/.env && \
	echo "DATABASE_URL=undefined" >> /app/.env && \
	echo "REDIS_URL=undefined" >> /app/.env && \
	echo "NODE_ENV=production" >> /app/.env
COPY . /app
RUN chmod +x /app/run_condo_domain_tests.sh
RUN --mount=type=cache,target=/root/.yarn/cache YARN_CACHE_FOLDER=/root/.yarn/cache yarn install --immutable
RUN set -ex \
    && turbo build --filter=condo^... \
    && rm -rf /app/.env  \
    && rm -rf /app/.config /app/.cache /app/.docker

# runtime
FROM base
USER app:app
WORKDIR /app
COPY --from=build --chown=app:app /app /app