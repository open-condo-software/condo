![Hackathon workflow](https://image.shutterstock.com/image-vector/banner-hackathon-design-sprintlike-event-260nw-1418226719.jpg)

# Rapid Development Node.js Hackathon template 

This template based on [KeystoneJS](https://github.com/keystonejs/keystone).
KeystoneJS is just a glue between [Express](https://github.com/expressjs/express), 
[ApolloGraphql](https://github.com/apollographql/), Mongoose/Knex (as ORM).

## Todo

**VERSION**: 0.0.1.**ALPHA**

 - [x] docs: how-to create frontend app 
 - [x] docs: how-to write backend app
 - [x] docs: how-to upgrade packages versions
 - [x] docs: how-to use with postgres
 - [x] example: Ant Design Pro + Next.js
 - [x] example: Internationalization (react-intl)
 - [x] ForgotUserPassword: Schema, API, Tests
 - [x] ForgotUserPassword: Page (example)
 - [x] ForgotUserPassword: Email notification hook
 - [ ] ForgotUserPassword: Options captcha support
 - [x] ChangePassword: Schema, API, Tests
 - [x] ChangePassword: Page (example)
 - [x] Auth: Schema, API, Test
 - [x] Auth: Page (example)
 - [ ] Auth: Options captcha support
 - [x] User: Schema, API, Tests
 - [x] User: reusable customization (like django.auth.user)
 - [x] Register: Schema, API, Test
 - [x] Register: Page (example)
 - [ ] Register: Email verification
 - [ ] Register: Extensibility (like django-registrations)
 - [ ] Register: Options captcha support
 - [ ] docs: project structure
 - [ ] docs: Deploy
 - [ ] CI: Deploy
 - [ ] prettier
 - [ ] linter
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
 - [x] Core: CI
 - [ ] Core: KeystoneJS AuthProvider (with isActive check!)
 - [ ] Core: Realtime support
 - [ ] Core: Attachment
 - [ ] Core: Background tasks
 - [ ] Core: Background scheduled tasks
 - [ ] Core: Metrics
 - [ ] Core: Roles and Permissions
 - [ ] Core: Logging
 - [ ] Core: lerna?
 - [ ] Core: benchmarks?
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

# Run databases by docker
docker-compose up -d

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
You can try `knex` migrations and writ about it here.

### Upgrade packages versions ###

```bash
# just run the command, and select packages for update (this command will fix the package.json files) 
yarn upgrade-interactive --latest
```

## Tips

### yarn add

 - `yarn add <package> -W` -- add package for all apps (`yarn add react react-dom -W`)
 - `yarn workspace @app/<name> add <package>` -- add package for special app (`yarn workspace @app/web add react react-dom`)

### yarn <command>

 - `yarn <command>` -- run command (`yarn dev`)
 - `yarn workspace @app/<name> <command>` -- run command inside workspace (`yarn workspace @app/web dev`)
 - `yarn --cwd <app-path-name> <command>` -- run command inside app (`yarn --cwd apps/web dev`)
