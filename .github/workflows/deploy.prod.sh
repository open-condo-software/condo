#!/usr/bin/env bash

[[ "${TRACE}" = "1" ]] && set -x
set -eo pipefail

function escape {
    echo "$1" | tr A-Z a-z | sed "s/[^a-z0-9]/-/g" | sed "s/^-+\|-+$//g"
}

function action {
    echo "!!===> $1"
}

function info {
    echo "       $1"
}

function run {
  info $1
  ssh ${SSH_DESTINATION} "$1"
}

VERSION=$(escape $1)

SSH_DESTINATION=root@178.170.194.20

WORKSPACE=$(escape $2)
APP=$(escape $3)
DOMAIN=$4

action "Prepare build .env file"
[ -f .env ] && cp .env .env.deploy.backup

cat <<EOT >> .env
# GEN by deploy.prod.sh!
NODE_ENV=production

COOKIE_SECRET=random
DATABASE_URL=undefined
WORKER_REDIS_URL=undefined

# production docker deploy envs!
DOCKER_FILE_INSTALL_COMMAND="python3 -m pip install 'psycopg2-binary>=2.8.5' && python3 -m pip install 'Django>=3.0.6'"

DOCKER_FILE_BUILD_COMMAND="yarn workspace @app/${WORKSPACE} build"
DOCKER_COMPOSE_APP_IMAGE_TAG=${WORKSPACE}
DOCKER_COMPOSE_START_APP_COMMAND="yarn workspace @app/${WORKSPACE} start"
DOCKER_COMPOSE_START_WORKER_COMMAND="yarn workspace @app/${WORKSPACE} worker"
DOCKER_COMPOSE_MIGRATION_COMMAND="yarn workspace @app/${WORKSPACE} migrate"

DOCKER_COMPOSE_COOKIE_SECRET=random
DOCKER_COMPOSE_DATABASE_URL=undefined
DOCKER_COMPOSE_WORKER_REDIS_URL=undefined
DOCKER_COMPOSE_SERVER_URL=undefined

EOT

source .env

if [[ -z "${DOCKER_COMPOSE_START_APP_COMMAND}" ]]; then
    echo "NO: DOCKER_COMPOSE_START_APP_COMMAND check .env"
    exit 1
fi
if [[ -z "${DOCKER_COMPOSE_START_WORKER_COMMAND}" ]]; then
    echo "NO: DOCKER_COMPOSE_START_WORKER_COMMAND check .env"
    exit 1
fi
if [[ -z "${DOCKER_COMPOSE_MIGRATION_COMMAND}" ]]; then
    echo "NO: DOCKER_COMPOSE_MIGRATION_COMMAND check .env"
    exit 1
fi
if [[ -z "${VERSION}" || -z "${WORKSPACE}" || -z "${APP}" || -z "${DOMAIN}" ]]; then
    echo "Use: $0 <VERSION> <WORKSPACE> <APP> <DOMAIN>"
    echo "Example: $0 v-1-0-0 condo prod v1.doma.ai"
    exit 1
fi

if [[ ! "${VERSION}" =~ ^v[-][0-9]+[-][0-9]+[-][0-9]+$ ]]; then
    echo "Use: $0 <VERSION>"
    echo "Error: wrong version format. Use something like v-1-0-0"
    exit 1
fi

echo "$(date +%Y-%m-%d-%H-%M-%S) - deploy.prod.sh $@ (WORKSPACE=${WORKSPACE}; APP=${APP}; VERSION=${VERSION}; SSH_DESTINATION=${SSH_DESTINATION})"

action "Check access"
info "Check SSH dokku "'"'"ssh ${SSH_DESTINATION} 'dokku help'"'"'
ssh ${SSH_DESTINATION} 'dokku help' > /dev/null
info "Check SSH docker "'"'"ssh ${SSH_DESTINATION} 'docker ps'"'"'
ssh ${SSH_DESTINATION} 'docker ps' > /dev/null
LOG_MESSAGE="$(date +%Y-%m-%d-%H-%M-%S) deploy.prod.sh by $(uname -a); user: $(id)"
run "echo '{$LOG_MESSAGE}\n' >> ~/.deploy.log"

if ! ssh ${SSH_DESTINATION} "dokku apps:list | grep -qFx ${APP}"; then

  # backups
  run "mkdir -p /BACKUP/db"

  SECRET=$(head -c 1024 /dev/urandom | base64 | tr -cd "[:upper:][:digit:]" | head -c 32)
  cat << EndOfMessage

  You should prepare dokku PRODUCTION app by hands! I can help you with a few commands:

  dokku apps:create ${APP}
  POSTGRES_IMAGE='postgres' POSTGRES_IMAGE_VERSION='13.2' dokku postgres:create ${APP}
  dokku postgres:link ${APP} ${APP}
  REDIS_IMAGE='redis' REDIS_IMAGE_VERSION='6.2' dokku redis:create ${APP}
  dokku redis:link ${APP} ${APP}
  dokku config:set --no-restart ${APP} DOKKU_APP_TYPE=dockerfile
  dokku config:set --no-restart ${APP} NODE_ENV=production
  dokku config:set --no-restart ${APP} SERVER_URL=https://${DOMAIN}
  dokku config:set --no-restart ${APP} START_WEB_COMMAND='${DOCKER_COMPOSE_START_APP_COMMAND}'
  dokku config:set --no-restart ${APP} START_WORKER_COMMAND='${DOCKER_COMPOSE_START_WORKER_COMMAND}'
  dokku checks:disable ${APP}
  dokku proxy:ports-set ${APP} http:80:5000
  dokku nginx:set ${APP} hsts false
  dokku nginx:set ${APP} hsts-include-subdomains false
  dokku domains:set ${APP} ${DOMAIN}
  dokku ps:scale ${APP} web=1 worker=1

  You should also set ${APP} variables FIREBASE_ADMIN_CONFIG FIREBASE_CONFIG ADDRESS_SUGGESTIONS_CONFIG COOKIE_SECRET like so:

  dokku config:set --no-restart ${APP} COOKIE_SECRET='${SECRET}'
  dokku config:set --no-restart ${APP} FIREBASE_ADMIN_CONFIG='...'
  dokku config:set --no-restart ${APP} FIREBASE_CONFIG='...'
  dokku config:set --no-restart ${APP} ADDRESS_SUGGESTIONS_CONFIG='...'

  And don't forget to run: 'dokku letsencrypt ${APP}' after the first deploy!

EndOfMessage

  echo "$DEPLOY_MESSAGE"
  exit 1
fi

DOCKER_IMAGE=${APP}:${VERSION}

action "Build PRODUCTION image ${DOCKER_IMAGE} locally"
bash ./bin/warm-docker-cache
# build image apps:prod
DOCKER_COMPOSE_APP_IMAGE_TAG="${APP}-${VERSION}" docker-compose build
# rename image apps:prod to prod:<version>
docker tag apps:${APP}-${VERSION} ${DOCKER_IMAGE}

action "Add GIT deploy TAG locally"
git tag -a ${APP}/${VERSION} -m "tag by deploy.prod.sh"
action "Push GIT deploy TAG to origin"
git push origin ${APP}/${VERSION}

action "Upload PRODUCTION image ${DOCKER_IMAGE} to server ${SSH_DESTINATION}"
docker save ${DOCKER_IMAGE} | bzip2 | ssh ${SSH_DESTINATION} 'bunzip2 | docker load'

action "Create database backup"
run "dokku postgres:export ${APP} > /BACKUP/db/${APP}-$(date +%Y-%m-%d-%H-%M-%S).dump"

action "Deploy ${APP} by ${DOCKER_IMAGE}"
run "docker tag ${DOCKER_IMAGE} dokku/${APP}:${VERSION}"
run "dokku tags:deploy ${APP} ${VERSION}"

action "Run migrations"
run "docker exec -u root ${APP}.web.1 ${DOCKER_COMPOSE_MIGRATION_COMMAND}"

if [[ -f .env.deploy.backup ]]; then
    action "Rollback local .env file"
    cp .env.deploy.backup .env
    rm .env.deploy.backup
fi
