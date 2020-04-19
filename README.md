# Rapid Development Node.js Hackathon template 

This template based on [KeystoneJS](https://github.com/keystonejs/keystone).
KeystoneJS just a glue between [Express](https://github.com/expressjs/express), 
[ApolloGraphql](https://github.com/apollographql/), Mongoose/Knex (as ORM).

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

# Running the Project

You should have `docker-compose`, `git` and `node` commands.

```bash
git clone ...
docker-compose up -d
yarn
yarn dev
```

Once running, the Keystone Admin UI is reachable via `http://127.0.0.1:3000/admin`.

## Tips

### yarn add

 - `yarn add <package> -W` -- add package for all apps (`yarn add react react-dom -W`)
 - `yarn workspace @app/<name> add <package>` -- add package for special app (`yarn workspace @app/web add react react-dom`)

### yarn <command>

 - `yarn <command>` -- run command (`yarn dev`)
 - `yarn workspace @app/<name> <command>` -- run command inside workspace (`yarn workspace @app/web dev`)
 - `yarn --cwd <app-path-name> <command>` -- run command inside app (`yarn --cwd apps/web dev`)
