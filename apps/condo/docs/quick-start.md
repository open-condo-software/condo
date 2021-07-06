Quick start
=====

Declare environment variables:

```shell
cat > .env << ENDOFFILE
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1/main
NODE_ENV=development
DISABLE_LOGGING=true
COOKIE_SECRET=random
SERVER_URL=http://localhost:3000
TESTS_FAKE_CLIENT_MODE=true

# production docker deploy envs!
DOCKER_FILE_INSTALL_COMMAND="python3 -m pip install 'psycopg2-binary>=2.8.5' && python3 -m pip install 'Django>=3.0.6'"
DOCKER_FILE_BUILD_COMMAND="echo yarn workspace @app/condo build"
DOCKER_COMPOSE_APP_IMAGE_TAG=condo
DOCKER_COMPOSE_START_APP_COMMAND="yarn workspace @app/condo start"
DOCKER_COMPOSE_START_WORKER_COMMAND="yarn workspace @app/condo worker"
DOCKER_COMPOSE_MIGRATION_COMMAND="yarn workspace @app/condo migrate"
DOCKER_COMPOSE_DATABASE_URL=postgresql://postgres:postgres@postgresdb/main
DOCKER_COMPOSE_COOKIE_SECRET=random
DOCKER_COMPOSE_SERVER_URL=http://localhost:3003
ENDOFFILE
```

Up database on default port:

```shell
docker-compose up -d postgresdb redis
```

Install dependencies and link yarn workspaces:

```shell
yarn
```

Build first image:

```shell
bash ./bin/warm-docker-cache
docker-compose build
```

Create first migration:

```shell
docker-compose run app yarn workspace @app/condo makemigrations
```

Migrate:

```shell
docker-compose run app yarn workspace @app/condo migrate
```

Run dev server:

```shell
yarn workspace @app/condo dev
```

## Mac users

Install prerequisites:

```
brew install nvm
nvm install v14.16.0
nvm alias default v14.16.0
node --version
npm --version
npm install -g yarn
```