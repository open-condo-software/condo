[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/migrator?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/migrator

# `@open-condo/migrator` [![NPM][npm-badge-link]][npm-pkg-link]
> CLI util to run code and infrastructure migrations for condo-based applications.
> 
> **NOTE**: The documentation below describes how to use these package, 
> but does not describe which migrations you need to run and why. 
> For this information, go to our [Migration Guides](https://github.com/open-condo-software/condo/blob/main/docs/migration.md).


## Table of contents
- [Local usage](#local-usage)
- [Remote usage](#remote-usage)
    - [Without installation](#without-installation)
    - [With installation](#with-installation)
- [How to run migration commands](#how-to-run-migration-commands)
    - [List of commands and arguments](#list-of-commands-and-arguments)
    - [Running command locally](#running-command-locally)
    - [Running command on remote environments](#running-command-on-remote-environments)
- [Available commands](#available-commands)
    - [`add-apps-kv-prefixes`](#add-apps-kv-prefixes)

## Local usage

You can use package in your [condo](https://github.com/open-condo-software/condo) monorepo fork by running:
```bash
condo-migrator --help
```

## Remote usage

### Without installation

You can use migrator on remote instances without installing additional packages by running:
```bash
npx @open-condo/migrator@latest --help
```

### With installation

Or alternatively you can install it with:
```bash
yarn add -D @open-condo/migrator
```

And then run with:
```bash
condo-migrator --help
```

## How to run migration commands

### List of commands and arguments

You can use the following command to explore list of all available commands:
```bash
condo-migrator --help
```

Then you can explore command arguments / description by running the following:
```bash
condo-migrator <command> --help
```

### Running command locally

You can migrate whole monorepo by running command from monorepo root. For example:

```bash
condo-migrator add-apps-kv-prefixes
```

Or you can more precisely run it for single / multiple apps:

```bash
condo-migrator add-apps-kv-prefixes -f condo address-service
```

### Running command on remote environments

You can also run migration commands on deployed applications where access `.env` files is not possible, 
since environment variables are passed from external tools and apps are deployed "one per pod".

For this scenarios you can migrate single app at a time by running commands like this:

```bash
REDIS_URL=redis://remote_user:*******@127.0.0.1:6379/6 condo-migrator add-kv-prefixes -f condo
```

> NOTE: You can remove REDIS_URL=** part if environment variables are already set (from `export` or other external tool)

You can also run migrator from specific app folder instead of using `--filter` arg:

```bash
cd apps/condo
condo-migrator add-kv-prefixes
```


## Available commands

### `add-apps-kv-prefixes`

This command will add `keyPrefix` to all your keys of your KV database (Redis).

For example, for `condo` app new keys will look like this:

- `my_key` -> `condo:my_key`
- `sess:asd123ghj` -> `condo:sess:asd123ghj`
- `bull:low:importMeters:123` -> `{condo:bull:low}:importMeters:123`

> You can read more about our motivation and key format in our [Migration Guides](https://github.com/open-condo-software/condo/blob/main/docs/migration.md)