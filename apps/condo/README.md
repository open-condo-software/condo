# condo quick start

```
cat > .env << ENDOFFILE
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1/main
NODE_ENV=development
DISABLE_LOGGING=true
COOKIE_SECRET=random
SERVER_URL=http://localhost:3000
TESTS_FAKE_CLIENT_MODE=true

# production docker deploy envs!
DOCKER_FILE_INSTALL_COMMAND=python3 -m pip install 'psycopg2-binary>=2.8.5' && python3 -m pip install 'Django>=3.0.6'
DOCKER_FILE_BUILD_COMMAND=echo yarn workspace @app/condo build
DOCKER_COMPOSE_APP_IMAGE_TAG=condo
DOCKER_COMPOSE_START_APP_COMMAND=yarn workspace @app/condo start
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
docker-compose run app yarn workspace @app/condo makemigrations

# migrate!
docker-compose run app yarn workspace @app/condo migrate

# run dev server!
yarn workspace @app/condo dev
```

## mac users

```
brew install nvm
nvm install v14.16.0
nvm alias default v14.16.0
node --version
npm --version
npm install -g yarn
```

# postgres schema migration

```
# create migration script at migrations/20201212124723-00xx_name.js
docker-compose run app yarn workspace @app/condo makemigrations

# migrate current DB to new schema
docker-compose run app yarn workspace @app/condo migrate

# if you want to rollback applied migration
docker-compose run app yarn workspace @app/condo kmigrator down
```

# typescript GraphQL types

```
# create ./schema.d.ts file with all GQL types
yarn workspace @app/condo maketypes
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

# how-to add new API / domain models

Command: `yarn workspace @app/condo createschema <domain>.<ModelName> "<field>: <type>; ..."`

Examples:
```
yarn workspace @app/condo createschema user.User "name:Text; password?:Password; isAdmin?:Checkbox; email?:Text; isEmailVerified?:Checkbox; phone?:Text; isPhoneVerified?:Checkbox; avatar?:File; meta:Json; importId:Text;"
yarn workspace @app/condo createschema ticket.Ticket "organization:Relationship:Organization:PROTECT; statusReopenedCounter:Integer; statusReason?:Text; status:Relationship:TicketStatus:PROTECT; number?:Integer; client?:Relationship:User:SET_NULL; clientName:Text; clientEmail:Text; clientPhone:Text; operator:Relationship:User:SET_NULL; assignee?:Relationship:User:SET_NULL; classifier:Relationship:TicketClassifier:PROTECT; details:Text; meta?:Json;
yarn workspace @app/condo createschema billing.BillingIntegrationLog 'context:Relationship:BillingIntegrationOrganizationContext:CASCADE; type:Text; message:Text; meta:Json'
```

Fields:

 - you can use `?` at the end of the field name if field is optional
 - simple types:
   - `name:Text;`, `password?:Password;`, 
   - `number?:Integer;`, `toPay:Decimal;`, 
   - `image:File;`, 
   - `date:DateTimeUtc;`, `date:CalendarDay;`, 
   - `meta?:Json`, 
   - `isAdmin:Checkbox`,
   - `type:Select:new_or_created,processing,completed,closed`
 - relations `<field>:Relationship:<ref-model>:<on-delete-action>`: 
   - `user:Relationship:User:PROTECT;` -- `PROTECT`: Forbid the deletion of the referenced object. To delete it you will have to delete all objects that reference it manually. SQL equivalent: `RESTRICT`.
   - `organization:Relationship:Organization:PROTECT;` -- PROTECT example ^^
   - `client?:Relationship:User:SET_NULL;` -- `SET_NULL`: Set the reference to NULL (requires the field to be nullable). For instance, when you delete a User, you might want to keep the comments he posted on blog posts, but say it was posted by an anonymous (or deleted) user. SQL equivalent: SET NULL.
   - `operator:Relationship:User:SET_NULL;` -- SET_NULL example ^^
   - `user:Relationship:User:CASCADE;` -- `CASCADE`: When the referenced object is deleted, also delete the objects that have references to it (when you remove a blog post for instance, you might want to delete comments as well). SQL equivalent: CASCADE.
   - `property:Relationship:Property:CASCADE;` -- CASCADE ^^
