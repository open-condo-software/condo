[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/miniapp-utils?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/miniapp-utils

# `@open-condo/miniapp-utils` [![NPM][npm-badge-link]][npm-pkg-link]
> A set of helper functions / components / hooks used to build new condo apps fast. \
> \
> The purpose of this package is to take away from you the tedious code
> to set up and maintain common miniapp patterns, leaving your focus solely on the domain logic


## Table of contents
[Installation](#installation)\
[Usage](#usage)

## Installation

> **NOTE**: This package uses `react` and `react-dom` as its peer dependencies,
> so make sure you've got ones installed. You should have no trouble with any react version having a hooks,
> but we're testing on versions >=16
To install package simply run the following command if you're using npm as your package manager:
```bash
npm i @open-condo/miniapp-utils react react-dom
```
or it's yarn alternative
```bash
yarn add @open-condo/miniapp-utils react react-dom
```

## Usage
You can import needed helpers / hooks / components by it's name
```typescript
import { isDebug, isSSR } from '@open-condo/miniapp-utils/helpers/environment'
import { usePrevious } from '@open-condo/miniapp-utils/hooks/usePrevious'
```