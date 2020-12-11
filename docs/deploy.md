# Deploy

We use docker-compose to deploy your application.
You can check the `docker-compose.yml` and important variables in `.env.example` file.

There are two important variables for building production image: 
 - `DOCKER_FILE_INSTALL_COMMAND` -- install extra packages and system requirements (ex: `python3 -m pip install 'psycopg2-binary>=2.8.5' && python3 -m pip install 'Django>=3.0.6'` or `apt-get -y install nano`)
 - `DOCKER_FILE_BUILD_COMMAND` -- run build static or prepare some project files for production (ex: `yarn build` or `yarn workspace @app/_example05app build`)

You can build a production docker container by `docker-compose build` command.

There are important variables for runtime:
 - `DOCKER_COMPOSE_START_APP_COMMAND` -- docker start command (ex: `yarn workspace @app/_back02keystone start`)
 - `DOCKER_COMPOSE_COOKIE_SECRET` -- the keystone important variable for sessions store (ex: `AWJfbsbaf!` or some secret random string)
 - `DOCKER_COMPOSE_SERVER_URL` -- the next.js important variable for API calls from frontend to backend (ex: `https://example.dok.8iq.dev`)

That's it!

You can build a production image localy and copy it to the production server by command: 
`docker save apps:prod | bzip2 | pv | ssh root@dok.8iq.dev 'bunzip2 | docker load'` 
(required `brew install pv` or just rm it from command)

Final script should looks like:
```shell script
# 0. warm docker cache (it's speed up your rebuild)
bash ./bin/warm-docker-cache
# 1. You should build a prod image.
docker-compose build
# 2.1 Copy to prod server `docker image`
docker save apps:prod | bzip2 | pv | ssh root@dok.8iq.dev 'bunzip2 | docker load'
# 2.2 Copy to prod server `docker-compose.yml` and required `.env`
scp ./docker-compose.yml root@dok.8iq.dev:~
scp ./.env root@dok.8iq.dev:~
# 3. Run redeploy command
ssh root@dok.8iq.dev 'docker-compose down && docker-compose up -d' 
```

NOTE: If you need some extra containers or you want to customize existing containers you can create 
`docker-compose.override.yml` file.

# DOKKU Deploy #

```shell script
# Prepare dokku
dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
dokku config:set --global DOKKU_LETSENCRYPT_EMAIL=contact@8iq.dev
dokku letsencrypt:cron-job --add
```

```shell script
# BUILD CONTAINER LOCALY AND SEND IT TO DOKKU SERVER
export DOCKER_COMPOSE_APP_IMAGE_TAG=coddi
docker-compose build
docker save apps:${DOCKER_COMPOSE_APP_IMAGE_TAG} | bzip2 | pv | ssh root@dok.8iq.dev 'bunzip2 | docker load'
```

```shell script
# CREATE DOKKU APPLICATION ON DOKKU SERVER SIDE
export APP=node5
export APP_VERSION=v5
export DOCKER_IMAGE=apps:coddi
export START_COMMAND='yarn workspace @app/CODDI start'

dokku apps:create ${APP}
dokku postgres:create ${APP}
dokku postgres:link ${APP} ${APP}

dokku config:set --no-restart ${APP} NODE_ENV=production
dokku config:set --no-restart ${APP} SERVER_URL=https://${APP}.dok.8iq.dev
dokku config:set --no-restart ${APP} DOKKU_DOCKERFILE_START_CMD="${START_COMMAND}"
dokku config:set --no-restart ${APP} COOKIE_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
dokku checks:disable ${APP}
dokku proxy:ports-set ${APP} http:80:5000
dokku nginx:set ${APP} hsts false
dokku nginx:set ${APP} hsts-include-subdomains false

docker tag ${DOCKER_IMAGE} dokku/${APP}:${APP_VERSION}
dokku tags:deploy ${APP} ${APP_VERSION}
docker exec -it -u root ${APP}.web.1 yarn workspace @app/CODDI migrate

dokku letsencrypt ${APP}
```
