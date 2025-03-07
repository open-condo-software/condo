[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/miniapp-utils?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/miniapp-utils

# `@open-condo/miniapp-utils` [![NPM][npm-badge-link]][npm-pkg-link]
> A set of helper functions / components / hooks used to build new condo apps fast. \
> \
> The purpose of this package is to take away from you the tedious code
> to set up and maintain common miniapp patterns, leaving your focus solely on the domain logic


## Table of contents
- [Installation](#installation)
    - [Peer dependencies](#peer-dependencies)
    - [Installing packages](#installing-packages)
        - [NPM](#install-all-npm)
        - [Yarn](#install-all-yarn)
- [Usage](#usage)

## Installation

### Peer dependencies
> **NOTE**: This package uses `react` / `react-dom` and `@apollo/client` as its peer dependencies,
> so make sure you've got ones installed. 
> 
> You should have no trouble with any react version having a hooks,
> but we're testing on versions `>=16`. 
> 
> Any apollo `3.x.x` should be fine too, but all utils are tested on `^3.11.8`
> 
> - `react` / `react-dom` are required for `/hooks/**` and `/components/**` entry points
> - `@apollo/client` is required for `/helpers/apollo.ts`
> - 'analytics' is required for `/helpers/analytics/*`
> 
> You can skip installing them if you don't use these utilities, as each utility is built separately, 
> but we highly recommend leaving them installed

### Installing packages

#### Install all (NPM)
```bash
npm i @open-condo/miniapp-utils react react-dom @apollo/client
```

#### Install all (Yarn)
```bash
yarn add @open-condo/miniapp-utils react react-dom @apollo/client
```

## Usage
You can import needed helpers / hooks / components by its name
```typescript
import { isDebug, isSSR } from '@open-condo/miniapp-utils/helpers/environment'
import { usePrevious } from '@open-condo/miniapp-utils/hooks/usePrevious'
```