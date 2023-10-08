# dev-api quick start

```
# create .env file!

cat > .env << ENDOFFILE
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1/dev-api
NODE_ENV=development
DISABLE_LOGGING=true
COOKIE_SECRET=random
SERVER_URL=http://localhost:4016

ENDOFFILE

# up database on default port
docker-compose up -d postgresdb redis

# create database if not exists
docker exec condo_postgresdb_1 bash -c "su postgres -c \"createdb ${DATABASE_NAME}\""

# install dependencies and link yarn workspaces
yarn

# create first migration!
yarn workspace @app/dev-api makemigrations

# migrate!
yarn workspace @app/dev-api @app/dev-api migrate

# run dev server!
yarn workspace @app/dev-api dev
```

# typescript GraphQL types

```
# create ./schema.d.ts file with all GQL types
yarn workspace @app/dev-api maketypes
```

# project structure

We use Domain Driven Design to distribute logic into the domain folders.

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
