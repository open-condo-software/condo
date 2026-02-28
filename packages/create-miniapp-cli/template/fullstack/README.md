# workflow

1. user chooses a billing self-service integration on condo
2. set up integration in this miniapp

# billing self service

```
cat > .env << ENDOFFILE
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1/main
NODE_ENV=development
DISABLE_LOGGING=true
COOKIE_SECRET=random
SERVER_URL=http://localhost:3000
TESTS_FAKE_CLIENT_MODE=true

INTEGRATION_CONFIG='{"id":"2ceaeb71-41a7-43e2-b620-470436ce3c16","name":"1С"}'


# production docker deploy envs!
DOCKER_FILE_INSTALL_COMMAND=python3 -m pip install 'psycopg2-binary>=2.8.5' && python3 -m pip install 'Django>=3.0.6'
DOCKER_FILE_BUILD_COMMAND=echo yarn workspace @app/billing-connector build
DOCKER_COMPOSE_APP_IMAGE_TAG=billing-connector
DOCKER_COMPOSE_START_APP_COMMAND=yarn workspace @app/billing-connector start
DOCKER_COMPOSE_DATABASE_URL=postgresql://postgres:postgres@postgresdb/main
DOCKER_COMPOSE_COOKIE_SECRET=random
DOCKER_COMPOSE_SERVER_URL=http://localhost:3003
ENDOFFILE

# up database on default port
docker-compose up -d postgresdb

# install dependencies and link yarn workspaces
yarn

# build first image!
bash ./bin/warm-docker-cache
docker-compose build

# create first migration!
docker-compose run app yarn workspace @app/billing-connector makemigrations

# migrate!
docker-compose run app yarn workspace @app/billing-connector migrate

# run dev server!
yarn workspace @app/rb dev
```

# postgres schema migration

```
# create migration script at migrations/20201212124723-00xx_name.js
docker-compose run app yarn workspace @app/billing-connector makemigrations

# migrate current DB to new schema
docker-compose run app yarn workspace @app/billing-connector migrate

# if you needed to rollback applyed migration
docker-compose run app yarn workspace @app/billing-connector kmigrator down
```

# typescript GraphQL types

```
# create ./schema.d.ts file with all GQL types
yarn workspace @app/billing-connector maketypes
```

# project structure

We use Domain Driven Design to distribute logic into the domain folders.
Read details [here](./domains/README.md).

Main folders:
 - `./<domain>/constants` -- contains various constants. Used on the client and server side
 - `./<domain>/gql` -- contains all GraphQL queries. Used on the server and client side
 - `./<domain>/components` -- contains react components. Used on the client side
 - `./<domain>/schema` -- keystone.js based domain models. The GQL API is formed based on these models. Used on the server side
 - `./<domain>/access` -- contains keystone.js access check logic. Used on the server side
 - `./<domain>/utils` -- some utilities functions for the client and server side
 - `./<domain>/utils/clientSchema` -- client side domain logic utilities
 - `./<domain>/utils/serverSchema` -- server side domain logic utilities
 - `./<domain>/utils/testSchema` -- server side test used domain logic utilities
 - `/lang` -- translations. Used on the client and server side
 - `/pages` -- next.js pages. Used on the client side
 - `/public` -- next.js static files like design images, icons
