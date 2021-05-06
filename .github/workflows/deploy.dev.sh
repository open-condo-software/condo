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

function rollback {
  ssh ${SSH_DESTINATION} "touch $DESTROY_SCRIPT_PATH"
  DESTROY_SCRIPT_CONTENT=$(ssh ${SSH_DESTINATION} "cat $DESTROY_SCRIPT_PATH")
  DESTROY_SCRIPT_NEW_CONTENT=$(printf '%s\n%s\n' "$1" "$DESTROY_SCRIPT_CONTENT")
  ssh ${SSH_DESTINATION} "echo '$DESTROY_SCRIPT_NEW_CONTENT' > $DESTROY_SCRIPT_PATH"
}

function run {
  info $1
  ssh ${SSH_DESTINATION} $1
}

SSH_DESTINATION=$1
APP=$(escape $2)
VERSION=$(escape $3)
BY_KEYWORD=$4
DOCKER_IMAGE=$5

if [[ "$6" == "--import" ]]; then
  IMPORT_DB_FROM_APP="$7"
fi

DOMAIN=${APP}.dev.doma.ai
DESTROY_SCRIPT_PATH="~/do.${APP}.destroy.sh"
RUN_AFTER_DEPLOY=false

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
if [[ -z "${SSH_DESTINATION}" ]] || [[ -z "${APP}" ]] || [[ "${BY_KEYWORD}" != "by" ]] || [[ -z "${DOCKER_IMAGE}" ]]; then
  echo "Use: $0 <SSH_DESTINATION> <APP-NAME> <APP-VERSION-NAME> by <DOCKER-IMAGE>"
  echo "Example: $0 root@prod.8iq.dev demo v1 by apps:demo"
  exit 1
fi

echo "$(date +%Y-%m-%d-%H-%M-%S) - deploy.dev.sh $@ (APP=${APP}; VERSION=${VERSION})"

action "Check access"
info "Check SSH dokku "'"'"ssh ${SSH_DESTINATION} 'dokku help'"'"'
ssh ${SSH_DESTINATION} 'dokku help' > /dev/null
info "Check SSH docker "'"'"ssh ${SSH_DESTINATION} 'docker ps'"'"'
ssh ${SSH_DESTINATION} 'docker ps' > /dev/null

if ! ssh ${SSH_DESTINATION} "dokku apps:list | grep -qFx ${APP}"; then
  action "Create new DOKKU app ${APP}"
  RUN_AFTER_DEPLOY=true

  run "dokku apps:create ${APP}"
  rollback "dokku apps:destroy ${APP} --force"

  run "POSTGRES_IMAGE='postgres' POSTGRES_IMAGE_VERSION='13.2' dokku postgres:create ${APP}"
  run "dokku postgres:link ${APP} ${APP}"
  rollback "dokku postgres:destroy ${APP} --force"

  run "REDIS_IMAGE='redis' REDIS_IMAGE_VERSION='6.2' dokku redis:create ${APP}"
  run "dokku redis:link ${APP} ${APP}"
  rollback "dokku redis:destroy ${APP} --force"

  run "dokku config:set --no-restart ${APP} DOKKU_APP_TYPE=dockerfile"
  run "dokku config:set --no-restart ${APP} NODE_ENV=production"
  run "dokku config:set --no-restart ${APP} SERVER_URL=https://${DOMAIN}"
  run "dokku config:set --no-restart ${APP} START_WEB_COMMAND='${DOCKER_COMPOSE_START_APP_COMMAND}'"
  run "dokku config:set --no-restart ${APP} START_WORKER_COMMAND='${DOCKER_COMPOSE_START_WORKER_COMMAND}'"
#  SECRET=$(head -c 1024 /dev/urandom | base64 | tr -cd "[:upper:][:digit:]" | head -c 32)
#  run "dokku config:set --no-restart ${APP} COOKIE_SECRET=${SECRET}"
  # FIREBASE_ADMIN_CONFIG FIREBASE_CONFIG ADDRESS_SUGGESTIONS_CONFIG COOKIE_SECRET already defined globally! (don't forget it)
  run "dokku checks:disable ${APP}"
  run "dokku proxy:ports-set ${APP} http:80:5000"
  run "dokku nginx:set ${APP} hsts false"
  run "dokku nginx:set ${APP} hsts-include-subdomains false"
  run "dokku domains:set ${APP} ${DOMAIN}"
  run "dokku ps:scale ${APP} web=1 worker=1"
fi

action "Deploy app ${APP} by ${DOCKER_IMAGE}"
run "docker tag ${DOCKER_IMAGE} dokku/${APP}:${VERSION}"
run "dokku tags:deploy ${APP} ${VERSION}"

if [[ ! -z "${IMPORT_DB_FROM_APP}" ]]; then
  action "Import database from ${IMPORT_DB_FROM_APP}"
  run "dokku postgres:export ${IMPORT_DB_FROM_APP} > /tmp/temp.dump" || echo 'export error!'
  run "dokku postgres:import ${APP} < /tmp/temp.dump" || echo 'import error!'
fi

action "Run migrations"
run "docker exec -u root ${APP}.web.1 ${DOCKER_COMPOSE_MIGRATION_COMMAND}"

if [[ "$RUN_AFTER_DEPLOY" == "true" ]]; then
  run "dokku letsencrypt ${APP}"
fi
