![Hackathon workflow](https://image.shutterstock.com/image-vector/banner-hackathon-design-sprintlike-event-260nw-1418226719.jpg)

# Rapid Development Node.js Hackathon template 

This template based on [KeystoneJS](https://github.com/keystonejs/keystone).
KeystoneJS is just a glue between [Express](https://github.com/expressjs/express), 
[ApolloGraphql](https://github.com/apollographql/), Mongoose/Knex (as ORM).

## Todo

**VERSION**: 0.0.1.**ALPHA**

 - [x] docs: how-to create frontend app 
 - [x] docs: how-to write backend app
 - [x] docs: how-to write mobile app
 - [x] docs: how-to upgrade packages versions
 - [x] docs: how-to use with postgres
 - [ ] docs: how-to debug react rerenders
 - [ ] docs: how-to use phone verification by firebase!
 - [x] docs: how-to deploy to dokku / heroku
 - [ ] docs: how-to write reusable components (mobile + web + ssr)
 - [x] example: Ant Design Pro + Next.js
 - [x] example: Internationalization (react-intl)
 - [ ] example: Upload Attachments Antd Form
 - [x] ForgotUserPassword: Schema, API, Tests
 - [x] ForgotUserPassword: Page (example)
 - [x] ForgotUserPassword: Email notification hook
 - [ ] ForgotUserPassword: Options captcha support
 - [x] ChangePassword: Schema, API, Tests
 - [x] ChangePassword: Page (example)
 - [x] Auth: Schema, API, Test
 - [x] Auth: SignIn/SignOut Page (example)
 - [x] Auth: SignIn next url support
 - [x] Auth: AuthRequired component
 - [ ] Auth: Options captcha support
 - [x] User: Schema, API, Tests
 - [x] Organization: CRUD: Schema, API, Tests
 - [x] Organization: CRUD: Page (example)
 - [x] Organization: required to select Organization component
 - [x] Organization: invite user by email: Schema, API, Tests
 - [x] Organization: invite user by email for existing emails: Page (example)
 - [ ] Organization: invite user by email for new emails: Page (example)
 - [x] Organization: invited users list: Page (example)
 - [x] Organization: bulk invite from excel file: Page (example)
 - [x] Organization: accept/reject invites: Schema, API, Tests
 - [x] Organization: accept/reject invites: Page (example)
 - [x] User: reusable customization (like django.auth.user)
 - [ ] User: unique phone/email check (for mongo/postgres)! 
 - [x] Register: Schema, API, Test
 - [x] Register: Page (example)
 - [ ] Register: Email verification (isEmailVerified)
 - [x] Register: Phone verification (isPhoneVerified)
 - [ ] Register: Extensibility (like django-registrations)
 - [ ] Register: Options captcha support
 - [ ] Register: Phone verification (example)
 - [x] Layout: Extensible base layout
 - [x] Layout: Mobile first support
 - [x] Layout: FormList container (container for list of items)
 - [x] Layout: FormTable container (container for table items)
 - [x] Layout: Excel export container (container for exporting excel data)
 - [ ] Layout: Dark mode
 - [ ] Layout: Antd compatible theme example (global variables for padding/margin/colors)
 - [ ] Layout: change site language widget
 - [ ] docs: project structure
 - [x] docs: Deploy
 - [ ] docs: step by step create new project example (like Next.js, like Django app)
 - [ ] UserNotifications: Schema, API, Tests
 - [ ] UserNotifications: Page (example 05 top menu) 
 - [ ] UserProfileSettings: Schema, API, Tests
 - [ ] UserProfileSettings: Page (example 05 user profile page)
 - [ ] UserProfileSettings: Extensibility
 - [ ] GlobalSettings: Schema, API, Tests
 - [ ] GlobalSettings: Admin and example
 - [x] Core: Monorepo with packages and apps
 - [x] Core: Multiple express backend support 
 - [x] Core: docker-compose
 - [x] Core: CI Tests
 - [ ] Core: CI Deploy
 - [ ] Core: CI Mobile app
 - [x] Core: Internationalization (react-intl)
 - [x] Core: SSR (by Next.js)
 - [x] Core: SSR + Apollo cache (don't query already received data)
 - [x] Core: SSR + Auth (authenticate queries on the server side)
 - [x] Core: SSR + Internationalization (same language as on client side)
 - [ ] Core: KeystoneJS AuthProvider (with isActive check!)
 - [ ] Core: isActive == false (need to kill all user sessions)
 - [ ] Core: KeystoneJS AuthProvider (login by phone / email!)
 - [ ] Core: KeystoneJS AuthProvider (optional email / phone field)
 - [ ] Core: Realtime update support (gql Subscriptions example)
 - [ ] Core: Attachment scale
 - [ ] Core: Background tasks
 - [ ] Core: Background scheduled tasks
 - [ ] Core: Metrics
 - [ ] Core: Roles and Permissions
 - [ ] Core: Logging
 - [ ] Core: lerna?
 - [ ] Core: benchmarks?
 - [ ] Core: prettier
 - [ ] Core: linter
 - [ ] Core: Jest + workspace + Next.js (check problems, write examples)
 - Auth my social apps? (https://www.keystonejs.com/keystonejs/auth-passport/)
 - CRDT example?

# Learn

0. You should have a [basic knowledge](https://htmlacademy.org/courses/html-css-basics/intro/html) about [HTML/CSS](https://www.internetingishard.com/html-and-css/) 
1. You should know [Modern JavaScript](https://javascript.info/)
2. You should know [GraphQL](https://graphql.org/)

## Server side

1. You know something about [Node.js](https://nodejs.dev/)
1. You should follow the [KeystoneJS tutorial](https://www.keystonejs.com/tutorials/new-project)
1. Something about mongo and mongoose

## Client side

1. You should know [React](https://nextjs.org/learn/basics/getting-started)
1. You should follow the [Next.js tutorial](https://nextjs.org/learn/basics/getting-started)

## More

1. yarn workspaces: https://classic.yarnpkg.com/en/docs/workspaces/
2. CSS animations: https://css-animations.io/ (base level), https://tympanus.net/codrops/ (pro examples)
3. JS Egghead.io courses: https://egghead.io/
4. Docker compose: https://docs.docker.com/compose/

# Philosophy

 1) BACKEND: You write domain models and services on backend side (it's better if each service have only one action)
 2) TESTS: TDD is matter! Tests should work parallel and independently! You should write tests in mind of extensibility (you don't need to rewrite the test if you add extra fields). You can move test to another git repository. You can run the tests on a remote production API by URL! We should test not only the our Unit.
 3) STYLE: You should follow the common style or change the whole style everywhere (not only in your files)
 4) THINK AND DESCRIBE BEFORE CODE! TODO(pahaz): write diagrams like c4 before write a code!

# Init new Project

You should have `docker-compose`, `git` and `node` commands.

```bash
# Clone and create STARTUP dir
git clone https://github.com/8iq/nodejs-hackathon-boilerplate-starter-kit my-new-startup
cd my-new-startup

# Change git origin to your STARTUP repo
git remote set-url origin git@github.com:USERNAME/REPOSITORY.git
# Add template origin for some core tempate updates
git remote add template https://github.com/8iq/nodejs-hackathon-boilerplate-starter-kit

# Create .env file!
cp .env.example .env

# Run databases by docker
docker-compose up -d mongodb postgresdb

# Install dependencies and link workspaces
yarn

# 1. Write BACKEND domain models: `schema`
# 2. Create FRONTEND app: `apps`

# Run BACKEND
yarn dev
```

Keystone Admin UI is reachable via `http://127.0.0.1:3000/admin`.

## Write Backend

### Create new Keystone.js APP

```bash
# Create Keystone.js new backend
mkdir apps/_back01keystone

# 1. create package.json, index.js and initial-data.js (check exampe)
# 2. define your schema by following https://www.keystonejs.com/tutorials/add-lists
# and use GQLListSchema wrappers for style checking and easy test writing

# Link new package and Install dependencies
yarn

# create .env file (development mode)
cat > .env << ENDOFFILE
DATABASE_URL=mongodb://mongo:mongo@127.0.0.1/main?authSource=admin
DISABLE_LOGGING=true
NODE_ENV=development
ENDOFFILE

# Start dev server on http://localhost:3000
yarn workspace @app/_back01keystone dev

# Follow the Keystone.js tutorial: https://www.keystonejs.com/tutorials/add-lists
# You can run `yarn <command>` inside new app workspace by
# `yarn workspace @app/_back01keystone <command>`
```

## Write Frontend APP

### Create new Next.js APP

```bash
# Create Next.js new React APP folder
mkdir apps/_example01app
cat > apps/_example01app/package.json << ENDOFFILE
{
  "name": "@app/_example01app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "isomorphic-unfetch": "^3.0.0",
    "next": "^9.3.5",
    "react": "^16.13.1",
    "react-dom": "^16.13.1"
  }
}
ENDOFFILE
mkdir apps/_example01app/pages
cat > apps/_example01app/pages/index.jsx << ENDOFFILE
function HomePage() {
  return <div>Welcome to Next.js!</div>
}

export default HomePage
ENDOFFILE

# Link new package and Install dependencies
yarn

# Start Next.js dev server on http://localhost:3000
yarn workspace @app/_example01app dev

# Follow the Next.js tutorial: https://nextjs.org/docs/getting-started#related
# You can run `yarn <command>` inside new app workspace by
# `yarn workspace @app/_example01app <command>`

# You can also check `apps/_example02app` and others examples
```

## Write mobile app ##

### Create Expo APP

```shell script
cd apps
expo init _mobile01
cd ..
# based on https://stackoverflow.com/questions/59920012/monorepo-expo-with-yarn-workspace-and-using-expo-install
cat > apps/_mobile01/package.json << ENDOFFILE
{
  "name": "@app/_mobile01",
  "version": "1.0.0",
  "main": "__generated__/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "eject": "expo eject",
    "postinstall": "expo-yarn-workspaces postinstall"
  },
  "dependencies": {
    "expo": "~38.0.8",
    "expo-status-bar": "^1.0.2",
    "react": "^16.13.1",
    "react-dom": "^16.13.1",
    "react-native": "https://github.com/expo/react-native/archive/sdk-38.0.2.tar.gz",
    "react-native-web": "~0.11.7"
  },
  "devDependencies": {
    "@babel/core": "^7.8.6",
    "babel-preset-expo": "~8.1.0",
    "expo-yarn-workspaces": "^1.2.1"
  }
}
ENDOFFILE
cat > apps/_mobile01/metro.config.js << ENDOFFILE
const { createMetroConfiguration } = require("expo-yarn-workspaces");

module.exports = createMetroConfiguration(__dirname);
ENDOFFILE
yarn
yarn workspace @app/_mobile01 postinstall

yarn workspace @app/_mobile01 start --clear
```

# Deploy #

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

# Others #

### Add package to existing APP ###

```bash
# Add new package to APP
yarn workspace @app/_example01app add antd
```

### How-to use with postgres ###

You need to set `DATABASE_URL` like `postgresql://postgres:postgres@127.0.0.1/main`.
```bash
# 1 create tables
yarn workspace @app/_back02keystone create-tables
```

**NOTE**: And there is no solutions to migrations yet... 
You can try `knex` migrations and write about it here.

### Upgrade packages versions ###

```bash
# just run the command, and select packages for update (this command will fix the package.json files) 
yarn upgrade-interactive --latest
```

### TESTS_FAKE_CLIENT_MODE ###

`@core/keystone/test.utils` can work in two modes:
 1. Real client mode. Allow sending HTTP/1.1 requests to a remote server
 2. Fake client mode. Allow using fake express requests by `supertest` lib 

The Real mode is better for end-to-end testing. You can also use it to test your production.

The Fake mode is better for debugging. Because it uses one process for the whole request/response process.
It's better for TDD like development process and to easy debug end-to-end request/response process.

You can use `TESTS_FAKE_CLIENT_MODE` to change test mode. This option setup the express app and the fake client in one process.
This allows you to put debugger breakpoints in any part of the request/response process. 
And use IDE integrations for easy debugging.

### Postgres migrations ###

https://github.com/keystonejs/keystone/discussions/3067

```bash
# download
curl -o kmigrator https://raw.githubusercontent.com/8iq/nodejs-hackathon-boilerplate-starter-kit/master/apps/_back02keystone/kmigrator.py
chmod +x kmigrator
# install dependencies
python3 -m pip install django
python3 -m pip install psycopg2-binary

# create new migrations based on the changes you have made
./kmigrator makemigrations

# applying database migrations
./kmigrator migrate
```

Add to `package.json`:
```js
  ...
  "scripts": {
    "makemigrations": "./kmigrator.py makemigrations",
    "migrate": "./kmigrator.py migrate",
    ...
  }
```

Run by `yarn makemigrations` and `yarn migrate`

### DEBUG QUERIES ###

For postgres you can set env `DEBUG=knex:query,knex:tx`. Example:
```bash
DEBUG=knex:query,knex:tx yarn dev @app/_back02keystone @app/_example05app @app/_realtime01app
```

For mongo you can set env `DEBUG_MONGOOSE=1`. Example:
```bash
DEBUG_MONGOOSE=1 yarn dev @app/_back02keystone @app/_example05app @app/_realtime01app
```

### Run multiple apps at the same time ###

You can use `bin/run-multiple-apps` to run more then one app.

Example:
```bash
node ./bin/run-multiple-apps @app/_back02keystone @app/_example05app @app/_realtime01app
```

Every app should have `multi-app-support.js` file. Check `_back02keystone`, `_example05app` and `_realtime01app` examples.

## Tips

### yarn add

 - `yarn add <package> -W` -- add package for all apps (`yarn add react react-dom -W`)
 - `yarn workspace @app/<name> add <package>` -- add package for special app (`yarn workspace @app/web add react react-dom`)

### yarn <command>

 - `yarn <command>` -- run command (`yarn dev`)
 - `yarn workspace @app/<name> <command>` -- run command inside workspace (`yarn workspace @app/web dev`)
 - `yarn --cwd <app-path-name> <command>` -- run command inside app (`yarn --cwd apps/web dev`)
