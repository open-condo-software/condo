![Hackathon workflow](https://image.shutterstock.com/image-vector/banner-hackathon-design-sprintlike-event-260nw-1418226719.jpg)

# Rapid Development Node.js Hackathon template 

This template based on [KeystoneJS](https://github.com/keystonejs/keystone).
KeystoneJS is just a glue between [Express](https://github.com/expressjs/express), 
[ApolloGraphql](https://github.com/apollographql/), Mongoose/Knex (as ORM).

## Todo

**VERSION**: 0.0.1.**ALPHA**

 - [ ] Add Ant Design Pro
 - [ ] Auth
 - [ ] Docs about structure
 - [ ] More Examples and tests
 - [ ] Deploy
 - [ ] CI
 - [ ] prettier
 - [ ] linter
 - [ ] Realtime support
 - Auth my social apps?
 - CRDT example?
 - multiple backend support?

# Learn

0. You should have a basic knowledge about [HTML/CSS](https://htmlacademy.org/courses/html-css-basics/intro/html)
1. You should know [Modern JavaScript](https://javascript.info/)
2. You should know [GraphQL](https://graphql.org/)

## Server side

1. You should follow the [KeystoneJS tutorial](https://www.keystonejs.com/tutorials/new-project)
1. Something about mongo and mongoose

## Client side

1. You should know [React](https://nextjs.org/learn/basics/getting-started)
1. You should follow the [Next.js tutorial](https://nextjs.org/learn/basics/getting-started)

## More

1. yarn workspaces: https://classic.yarnpkg.com/en/docs/workspaces/
2. CSS animations: https://css-animations.io/
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
