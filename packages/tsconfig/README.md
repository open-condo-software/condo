[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/tsconfig?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/tsconfig

# `@open-condo/tsconfig` [![NPM][npm-badge-link]][npm-pkg-link]

> A set of frequently used tsconfig.json for various typescript applications within the condo ecosystem.

## Table of contents
[Installation](#installation)\
[Usage](#usage)

## Installation
To install package simply run the following command if you're using npm as your package manager:
```bash
npm i @open-condo/tsconfig
```
or it's yarn alternative
```bash
yarn add @open-condo/tsconfig
```

## Usage

To use a config, simply add it to the `extends` field of your `tsconfig.json`.

### React library with `src` folder

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@open-condo/tsconfig/react-lib.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Next.js application

```json
{
  "schema": "https://json.schemastore.org/tsconfig",
  "extends": "@open-condo/tsconfig/next-app.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

> Make sure to override `exclude`, `include`, `rootDir`, `outDir` and `baseUrl` properties
> since it's calculation is relative to extendable tsconfig path