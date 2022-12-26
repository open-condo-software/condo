# `@open-condo/tsconfig`

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
  "extends": "@open-condo/tsconfig/react-lib.json"
}
```

### Next.js application

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@open-condo/tsconfig/next-app.json"
}
```