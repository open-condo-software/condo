# Some advanced topics # 

## Database and Migrations

Migration process based on: https://github.com/keystonejs/keystone/discussions/3067

You need to set `DATABASE_URL` like `postgresql://postgres:postgres@127.0.0.1/main`.
Check is your database really running? or run it by docker `docker-compose up -d postgresdb`.

Then you need to install kmigrator dependencies:
```bash
# install dependencies
python3 -m pip install django
python3 -m pip install psycopg2-binary
```

And now you can create tables: `yarn workspace @app/condo migrate`

If you change some schemas you need to create database schema migration: `yarn workspace @app/condo makemigrations`

You can also check [migrations guide with snippets, errors and solutions](apps/condo/docs/migrations.md)

## Upgrade packages versions

```bash
# just run the command, and select packages for update (this command will fix the package.json files) 
yarn upgrade-interactive --latest
```

## TESTS_FAKE_CLIENT_MODE

`@open-condo/keystone/test.utils` can work in two modes:
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
DEBUG=knex:query,knex:tx yarn workspace @app/ex02back dev
```

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
 - `yarn workspaces foreach -pt run dev` -- run `dev` command for all apps and packages
