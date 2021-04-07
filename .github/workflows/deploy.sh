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
  echo $1
  echo $@
  ssh ${SSH_DESTINATION} $1
}

GIT_REPO=$( git config --local remote.origin.url | sed -n 's#.*/\([^.]*\)\.git#\1#p' )
GIT_BRANCH=$( git branch | grep -e "^*" | cut -d' ' -f 2 )
GIT_COMMIT=$( git rev-parse HEAD )
SSH_DESTINATION=$1
SUBDOMAIN=$(escape $GIT_BRANCH)
APP_DOMAIN=$SUBDOMAIN.dev.doma.ai
DESTROY_SCRIPT_PATH="~/do.$SUBDOMAIN.destroy.sh"
DOCKER_IMAGE=apps:condo
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
if [[ -z "${SSH_DESTINATION}" ]]; then
    echo "Use: $0 <SSH_DESTINATION>"
    echo "Example: $0 root@prod.8iq.dev"
    exit 1
fi

echo "$(date +%Y-%m-%d-%H-%M-%S) - deploy.sh $@ (SUBDOMAIN=${SUBDOMAIN})"

action "Check access"
info "Check SSH dokku "'"'"ssh ${SSH_DESTINATION} 'dokku help'"'"'
ssh ${SSH_DESTINATION} 'dokku help' > /dev/null
info "Check SSH docker "'"'"ssh ${SSH_DESTINATION} 'docker ps'"'"'
ssh ${SSH_DESTINATION} 'docker ps' > /dev/null

if ! ssh ${SSH_DESTINATION} "dokku apps:list | grep -qFx ${SUBDOMAIN}"; then
  action "Create new DOKKU app ${SUBDOMAIN}"
  RUN_AFTER_DEPLOY=true

  run "dokku apps:create ${SUBDOMAIN}"
  rollback "dokku apps:destroy ${SUBDOMAIN} --force"

  run "POSTGRES_IMAGE='postgres' POSTGRES_IMAGE_VERSION='13.2' dokku postgres:create ${SUBDOMAIN}"
  run "dokku postgres:link ${SUBDOMAIN} ${SUBDOMAIN}"
  rollback "dokku postgres:destroy ${SUBDOMAIN} --force"

  run "REDIS_IMAGE='redis' REDIS_IMAGE_VERSION='6.2' dokku redis:create ${SUBDOMAIN}"
  run "dokku redis:link ${SUBDOMAIN} ${SUBDOMAIN}"
  rollback "dokku redis:destroy ${SUBDOMAIN} --force"

  run "dokku config:set --no-restart ${SUBDOMAIN} DOKKU_APP_TYPE=dockerfile"
  run "dokku config:set --no-restart ${SUBDOMAIN} NODE_ENV=production"
  run "dokku config:set --no-restart ${SUBDOMAIN} SERVER_URL=https://${APP_DOMAIN}"
  run "dokku config:set --no-restart ${SUBDOMAIN} START_WEB_COMMAND='${DOCKER_COMPOSE_START_APP_COMMAND}'"
  run "dokku config:set --no-restart ${SUBDOMAIN} START_WORKER_COMMAND='${DOCKER_COMPOSE_START_WORKER_COMMAND}'"
#  SECRET=$(head -c 1024 /dev/urandom | base64 | tr -cd "[:upper:][:digit:]" | head -c 32)
#  run "dokku config:set --no-restart ${SUBDOMAIN} COOKIE_SECRET=${SECRET}"
  # FIREBASE_ADMIN_CONFIG FIREBASE_CONFIG ADDRESS_SUGGESTIONS_CONFIG COOKIE_SECRET already defined globally! (don't forget it)
  run "dokku checks:disable ${SUBDOMAIN}"
  run "dokku proxy:ports-set ${SUBDOMAIN} http:80:5000"
  run "dokku nginx:set ${SUBDOMAIN} hsts false"
  run "dokku nginx:set ${SUBDOMAIN} hsts-include-subdomains false"
  run "dokku domains:set ${SUBDOMAIN} ${APP_DOMAIN}"
  run "dokku ps:scale ${SUBDOMAIN} web=1 worker=1"
fi

action "Deploy app ${SUBDOMAIN} by ${DOCKER_IMAGE}"
run "docker tag ${DOCKER_IMAGE} dokku/${SUBDOMAIN}:${GIT_COMMIT}"
run "dokku tags:deploy ${SUBDOMAIN} ${GIT_COMMIT}"
run "docker exec -u root ${SUBDOMAIN}.web.1 ${DOCKER_COMPOSE_MIGRATION_COMMAND}"

if [[ "$RUN_AFTER_DEPLOY" == "true" ]]; then
  run "dokku letsencrypt ${SUBDOMAIN}"
fi
