# Development #

This page would be helpful if you want to change something in condo. It contains core concepts and general knowledge. 


## Quick start for development

To launch condo, or any other Keystone + Next app in development mode, use this:

`yarn workspace @app/condo dev`

You can change code of the app and inspect changes in `localhost:3000`


## Apps and packages

This project is a monorepo, which is split to apps and packages.

Apps are independent applications and cannot use code from each other.

For example: If you need to create a chat app for your residents - you can create new app `apps/chat`

Good example of application is `apps/condo` - it is Keystone + Next based web application that allows you to manage buildings, tickets and residents

Packages, on the other hand, are internal libraries and can be used in any app

Good example of package is `packages/webhooks` it allows you to add webhooks feature to any of your `apps`


## Tech stack

Our primary tech stack is:
- [ApolloGraphQL](https://www.apollographql.com)
- [KeystoneJS](https://github.com/keystonejs/keystone-5)
- [NextJS](https://nextjs.org)

All our apps and packages use this tech stack.


## Database and migrations

We primarily use Postgres as our main database. MongoDB can be configured in Keystone, but it is not supported and not guaranteed it will work without any changes in codebase

Our database migration process is based on: https://github.com/keystonejs/keystone/discussions/3067

> Note: `apps/condo` is used as an example, but any Keystone + Next based app can be configured to use this migration process. 
> Please check `apps/condo/package.json` to see how described commands work on the inside

### How to launch migrations

1. Make sure `DATABASE_URL` env like `postgresql://postgres:postgres@127.0.0.1/main` is set.
2. Make sure your DB is ready to accept connections or run it by docker `docker-compose up -d postgresdb`.
3. Install kmigrator dependencies:
    ```bash
    # install dependencies
    python3 -m pip install django
    python3 -m pip install psycopg2-binary
    ```
4. Migrate (create tables as defined in schema) `yarn workspace @app/condo migrate`

### How to make migrations

If you make any changes in schema, you need to create migrations:

- `yarn workspace @app/condo makemigrations`

**Complex cases**

- `yarn workspace @app/condo migrate:down` -- Revert last migration
- `yarn workspace @app/condo migrate:unlock` -- Manually unlock migrations table

Check more in depth [migrations guide with snippets, errors and solutions](/apps/condo/docs/migrations.md)


## External packages

If you need to add new external package, such as `lodash` to your `app` or `package` use these commands:

### yarn add:

- `yarn add <package> -W` -- add package for all apps (`yarn add react react-dom -W`)
- `yarn workspace @app/<name> add <package>` -- add package for special app (`yarn workspace @app/web add react react-dom`)

If you need to run command inside of any package or app, use these commands:

### yarn run:

- `yarn <command>` -- run command (`yarn dev`)
- `yarn workspace @app/<name> <command>` -- run command inside workspace (`yarn workspace @app/web dev`)
- `yarn --cwd <app-path-name> <command>` -- run command inside app (`yarn --cwd apps/web dev`)
- `yarn workspaces foreach -pt run dev` -- run `dev` command for all apps and packages

### Upgrade packages versions

```bash
# just run the command, and select packages for update (this command will fix the package.json files) 
yarn upgrade-interactive --latest
```

## Testing

We use Jest as our primarily test runner. To launch tests in `apps/condo` - use this command:

- `yarn workspace @app/condo test` -- Launch all tests.. Warning, this is going to take a while..
- `yarn workspace @app/condo test User.test.js` -- Test only User schema

### TESTS_FAKE_CLIENT_MODE

`@open-condo/keystone/test.utils` can work in two modes:
 1. Real client mode. Allow sending HTTP/1.1 requests to a remote server
 2. Fake client mode. Allow using fake express requests by `supertest` lib 

The Real mode is better for end-to-end testing. You can also use it to test your production.

The Fake mode is better for debugging. Because it uses one process for the whole request/response process.
It's better for TDD like development process and to easy debug end-to-end request/response process.

You can use `TESTS_FAKE_CLIENT_MODE` to change test mode. This option setup the express app and the fake client in one process.
This allows you to put debugger breakpoints in any part of the request/response process. 
And use IDE integrations for easy debugging.

### Debug database queries

For postgres you can set env `DEBUG=knex:query,knex:tx`. Example:
```bash
DEBUG=knex:query,knex:tx yarn workspace @app/condo dev
```

## Linting

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


## Code Analysis

We use [semgrep](https://semgrep.dev/) as our static analysis tool. It enforces developers to avoid use vulnerable code

We don't allow vulnerabilities in the repo. To ensure this we run [semgrep](https://semgrep.dev/) SAST analysis on `CI`.

The configuration and running parameters for the [semgrep](https://semgrep.dev/) is found under `bin/run-semgrep.sh`

**Available CLI-commands:**
- `yarn analysis` static code analysis (SAST) <- this command runs on CI