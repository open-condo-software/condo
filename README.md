![Hackathon workflow](https://image.shutterstock.com/image-vector/banner-hackathon-design-sprintlike-event-260nw-1418226719.jpg)

# Rapid Development Node.js Hackathon template 

This template based on [KeystoneJS](https://github.com/keystonejs/keystone).
KeystoneJS is just a glue between [Express](https://github.com/expressjs/express), 
[ApolloGraphql](https://github.com/apollographql/), Mongoose/Knex (as ORM).

## Todo

**VERSION**: 0.0.1.**ALPHA**

 - [x] docs: now-to create frontend app 
 - [x] example: Ant Design Pro + Next.js
 - [x] example: Internationalization (react-intl)
 - [x] ForgotUserPassword: Schema, API, Tests
 - [ ] ForgotUserPassword: Page (example)
 - [x] Auth: Schema, API, Test
 - [x] Auth: Page (example)
 - [x] User: Schema, API, Tests
 - [ ] User: reusable customization (like django user)
 - [x] Register: Schema, API, Test
 - [x] Register: Page (example)
 - [ ] docs: now-to write backend
 - [ ] docs: project structure
 - [ ] docs: Deploy
 - [ ] CI: Deploy
 - [ ] prettier
 - [ ] linter
 - [ ] Model: Notifications
 - [ ] Test: Notifications
 - [ ] Model: UserSettings
 - [ ] Test: UserSettings
 - [ ] Page: UserSettings
 - [ ] Model: GlobalSettings
 - [ ] Test: GlobalSettings
 - [ ] Page: GlobalSettings
 - [x] Core: Monorepo with packages and apps
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
 - multiple backend support?

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
```bash
# TODO

```

## Write Frontend APP

### Create new APP

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

### Add package to existing APP

```bash
# Add new package to APP
yarn workspace @app/_example01app add antd
```

## Tips

### yarn add

 - `yarn add <package> -W` -- add package for all apps (`yarn add react react-dom -W`)
 - `yarn workspace @app/<name> add <package>` -- add package for special app (`yarn workspace @app/web add react react-dom`)

### yarn <command>

 - `yarn <command>` -- run command (`yarn dev`)
 - `yarn workspace @app/<name> <command>` -- run command inside workspace (`yarn workspace @app/web dev`)
 - `yarn --cwd <app-path-name> <command>` -- run command inside app (`yarn --cwd apps/web dev`)
