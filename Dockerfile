FROM buildpack-deps:buster AS base
# https://hub.docker.com/_/node
# https://github.com/nodejs/docker-node/blob/6e7d6511aba22da645ec21bd157a369a78794e6c/14/buster/Dockerfile
# https://hub.docker.com/_/python
# https://github.com/docker-library/python/blob/3897bb4660fe97fc202f50431dd3e6cdc0dedd4a/3.8/buster/Dockerfile
COPY --from=python:3.8-buster /usr/local/ /usr/local/
COPY --from=node:14-buster /usr/local/ /usr/local/
COPY --from=node:14-buster /opt/ /opt/
# http://bugs.python.org/issue19846
# > At the moment, setting "LANG=C" on a Linux system *fundamentally breaks Python 3*, and that's not OK.
ENV LANG C.UTF-8
# Add app user/group! Clean packages and fix links! Check version! And install some extra packages!
ARG DOCKER_FILE_INSTALL_COMMAND
ENV DOCKER_FILE_INSTALL_COMMAND ${DOCKER_FILE_INSTALL_COMMAND}
RUN set -ex \
	&& groupadd -r app --gid=999 \
	&& useradd --system --create-home --home /home/app --gid 999 --uid=999 --shell /bin/bash app \
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
	&& bash -c "${DOCKER_FILE_INSTALL_COMMAND:?Build argument DOCKER_FILE_INSTALL_COMMAND needs to be set (check READEME.md)!}" \
	&& echo "OK"

# Build container
FROM base AS build
ARG DOCKER_FILE_BUILD_COMMAND
ENV DOCKER_FILE_BUILD_COMMAND ${DOCKER_FILE_BUILD_COMMAND}
USER app:app
WORKDIR /home/app
RUN echo "# Build time .env config!" >> /home/app/.env && \
	echo "COOKIE_SECRET=undefined" >> /home/app/.env && \
	echo "DATABASE_URL=undefined" >> /home/app/.env && \
	echo "REDIS_URL=undefined" >> /home/app/.env && \
	echo "NODE_ENV=production" >> /home/app/.env
# If you don't have this directory, you can create it by command `bash ./bin/warm-docker-cache` or just create empty ./.docker-cache-warming dir (no cache mode)
ADD --chown=app:app ./.docker-cache-warming /home/app
# Cache packages!
RUN set -ex && yarn install --frozen-lockfile
ADD --chown=app:app . /home/app
RUN set -ex && yarn && bash -c "${DOCKER_FILE_BUILD_COMMAND:?Build argument DOCKER_FILE_BUILD_COMMAND needs to be set (check READEME.md)!}" && \
    yarn cache clean && rm -rf /home/app/.env && rm -rf /home/app/.config && rm -rf /home/app/.yarn && rm -rf /home/app/.cache && \
    ls -lah /home/app/

# Runtime container
FROM base
USER app:app
WORKDIR /home/app
COPY --from=build --chown=root:root /home/app /home/app
