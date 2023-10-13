FROM buildpack-deps:buster AS base
# https://hub.docker.com/_/node
# https://github.com/nodejs/docker-node/blob/6e7d6511aba22da645ec21bd157a369a78794e6c/14/buster/Dockerfile
# https://hub.docker.com/_/python
# https://github.com/docker-library/python/blob/3897bb4660fe97fc202f50431dd3e6cdc0dedd4a/3.8/buster/Dockerfile
COPY --from=python:3.8-buster /usr/local/ /usr/local/
COPY --from=node:16-buster /usr/local/ /usr/local/
COPY --from=node:16-buster /opt/ /opt/
# http://bugs.python.org/issue19846
# > At the moment, setting "LANG=C" on a Linux system *fundamentally breaks Python 3*, and that's not OK.
ENV LANG C.UTF-8
# Add app user/group! Clean packages and fix links! Check version! And install some extra packages!
RUN set -ex \
	&& groupadd -r app --gid=999 \
	&& useradd --system --create-home --home /app --gid 999 --uid=999 --shell /bin/bash app \
	&& ldconfig -v \
	&& find /usr/local -depth \
		\( \
			\( -type d -a \( -name test -o -name tests -o -name idle_test \) \) \
			-o \
			\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
		\) -exec rm -rf '{}' + \
	&& rm -f /usr/local/bin/docker-entrypoint.sh \
	&& python --version \
	&& pip --version \
	&& node --version \
	&& npm --version \
	&& yarn --version \
	&& python3 -m pip install 'psycopg2-binary==2.9.4' && python3 -m pip install 'Django==4.1.2' \
	&& npm i -g turbo \
    && echo "OK"

# Build container
FROM base AS build
USER app:app
WORKDIR /app

RUN echo "# Build time .env config!" >> /app/.env && \
	echo "COOKIE_SECRET=undefined" >> /app/.env && \
	echo "DATABASE_URL=undefined" >> /app/.env && \
	echo "REDIS_URL=undefined" >> /app/.env && \
	echo "NODE_ENV=production" >> /app/.env && \
	echo "FILE_FIELD_ADAPTER=local" >> /app/.env

COPY --chown=app:app . /app
RUN yarn install --immutable

# yarn workspaces foreach -pt run build
RUN set -ex \
    && turbo build --filter="./packages/*" \
    && turbo build --filter="./apps/*" \
    && rm -rf /app/.env  \
    && rm -rf /app/.config /app/.cache /app/.docker  \
    && ls -lah /app/

# Runtime container
FROM base
USER app:app
WORKDIR /app
COPY --from=build --chown=root:root /app /app
