# `@open-condo/create-miniapp-cli`
> CLI for scaffolding Condo-compatible miniapps (server, client, or full-stack) inside this monorepo.

## Table of contents
- [Overview](#overview)
- [Usage](#usage)
    - [From monorepo root](#from-monorepo-root)
    - [CLI options](#cli-options)
- [What gets generated](#what-gets-generated)
- [Dependency management](#dependency-management)
- [Development](#development)

## Overview
`create-miniapp-cli` bootstraps a new miniapp from curated templates and then wires it into the monorepo:
- scaffolds files from `template/{server|client|fullstack}`
- applies selected feature flags (worker, OIDC, schema stitching, CI job, review env)
- updates required monorepo config files (`.gitmodules`, Helm templates/values, workflow files, `werf.yaml`)
- runs install/prepare flow (unless skipped)

## Usage

### From monorepo root
```bash
yarn create-miniapp
```

You can pass app name directly:
```bash
yarn create-miniapp my-new-app
```

The command is interactive and asks for app type and optional features.

### CLI options
- `--noInstall` - skip dependency installation step
- `-i, --import-alias <alias>` - set custom import alias (default is `@your-app-name`)

Example:
```bash
yarn create-miniapp my-new-app --noInstall -i @my-new-app
```

## What gets generated
Depending on answers in prompts, the CLI can generate:
- `server` app template
- `client` app template (OIDC optional)
- `full-stack` template (OIDC optional, schema stitching optional)

Worker files and worker scripts are generated only when user selects worker support.

## Dependency management
Template `package.json` files keep external dependency versions as `0.0.0` placeholders.

At scaffold time, CLI:
1. Reads `config/deps-manifest.json` (single source of truth).
2. Refreshes manifest from currently used monorepo dependencies.
3. For major updates, asks for confirmation (`y/n`).
4. Replaces `0.0.0` placeholders in generated app `package.json` with manifest versions.

This keeps generated apps aligned with versions already used in the monorepo.

## Development
From monorepo root:
```bash
yarn workspace @open-condo/create-miniapp-cli typecheck
yarn workspace @open-condo/create-miniapp-cli build
```

Run local built CLI:
```bash
yarn workspace @open-condo/create-miniapp-cli build
node ./packages/create-miniapp-cli/dist/index.js
```
