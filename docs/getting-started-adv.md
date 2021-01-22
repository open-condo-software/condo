# Some advanced topics # 

## Update from 8iq repo

```bash
# 1) Add 8iq git remote origin for easy updates
git remote add template git@github.com:8iq/nodejs-hackathon-boilerplate-starter-kit.git

# 2) Pull changes
git pull template master --allow-unrelated-histories

# 3) Resolve conflicts if exists (check by git status) and create merge commit
git commit
```

## Write Backend (Keystone.js) APP by hands

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

## Write Frontend (Next.js) APP by hands

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

# You can also check `apps/_example05app` and others examples
```

## Write mobile (Expo) APP by hands

```bash
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

## Add package to existing APP

```bash
# Add new package to APP
yarn workspace @app/_example01app add antd
```

## Use mongo

You need to set `DATABASE_URL` like `mongodb://mongo:mongo@127.0.0.1/main?authSource=admin`.
Check is your database really running? or run it by docker `docker-compose up -d mongodb`.
Then, create tables.
```bash
yarn workspace @app/_back02keystone create-tables
```

## Use postgresql

You need to set `DATABASE_URL` like `postgresql://postgres:postgres@127.0.0.1/main`.
Check is your database really running? or run it by docker `docker-compose up -d postgresdb`.

Then, create tables.
```bash
yarn workspace @app/_back02keystone create-tables
```

## Postgres migrations

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

## Upgrade packages versions

```bash
# just run the command, and select packages for update (this command will fix the package.json files) 
yarn upgrade-interactive --latest
```

## TESTS_FAKE_CLIENT_MODE

`@core/keystone/test.utils` can work in two modes:
 1. Real client mode. Allow sending HTTP/1.1 requests to a remote server
 2. Fake client mode. Allow using fake express requests by `supertest` lib 

The Real mode is better for end-to-end testing. You can also use it to test your production.

The Fake mode is better for debugging. Because it uses one process for the whole request/response process.
It's better for TDD like development process and to easy debug end-to-end request/response process.

You can use `TESTS_FAKE_CLIENT_MODE` to change test mode. This option setup the express app and the fake client in one process.
This allows you to put debugger breakpoints in any part of the request/response process. 
And use IDE integrations for easy debugging.

## Debug database queries

For postgres you can set env `DEBUG=knex:query,knex:tx`. Example:
```bash
DEBUG=knex:query,knex:tx yarn dev @app/_back02keystone @app/_example05app @app/_realtime01app
```

For mongo you can set env `DEBUG_MONGOOSE=1`. Example:
```bash
DEBUG_MONGOOSE=1 yarn dev @app/_back02keystone @app/_example05app @app/_realtime01app
```

## Run multiple apps at the same time

You can use `bin/run-multiple-apps` to run more then one app.

Example:
```bash
node ./bin/run-multiple-apps @app/_back02keystone @app/_example05app @app/_realtime01app
```

Every app should have `multi-app-support.js` file. Check `_back02keystone`, `_example05app` and `_realtime01app` examples.

## linter

We use [eslint](https://eslint.org) as our linter. It enforces code-style and best-practices

We don't allow bad code into the repo. To ensure this we run [eslint](https://eslint.org) on `CI`.

The configuration for the [eslint](https://eslint.org) is found under `package.json`

**Available CLI-commands:**

 - `yarn lint` lint whole project <- this command runs on CI
 - `yarn run eslint <directory>` check files in `<directory>`
 - `yarn run eslint --fix <directory>` check files in `<directory>` and fix them if possible

**Editor integrations:**

[Webstorm integration:](https://plugins.jetbrains.com/plugin/7494-eslint)

[VSCode integration:](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

[Other editors](https://eslint.org/docs/user-guide/integrations#editors)

## Tips

### yarn add

 - `yarn add <package> -W` -- add package for all apps (`yarn add react react-dom -W`)
 - `yarn workspace @app/<name> add <package>` -- add package for special app (`yarn workspace @app/web add react react-dom`)

### yarn <command>

 - `yarn <command>` -- run command (`yarn dev`)
 - `yarn workspace @app/<name> <command>` -- run command inside workspace (`yarn workspace @app/web dev`)
 - `yarn --cwd <app-path-name> <command>` -- run command inside app (`yarn --cwd apps/web dev`)
