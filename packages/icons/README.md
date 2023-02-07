[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/icons?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/icons

# `@open-condo/icons` [![NPM][npm-badge-link]][npm-pkg-link]
> A set of SVG icons presented as React components

 
## Table of contents
[Workflow](#workflow)\
[Installation](#installation)\
[Usage](#usage)

## Workflow

Icons set is maintained in Figma by design team, — this is a primary source of changes.
Developers should only pull and commit changes, made by design team.

See [Import](./docs/IMPORT.md)

## Installation

To install package simply run the following command if you're using npm as your package manager:
```bash
npm i @open-condo/icons
```
or it's yarn alternative
```bash
yarn add @open-condo/icons
```

## Usage
You can import needed component with its props directly from package entry point like this:
```typescript
import { Car } from '@open-condo/icons'
```

By default, all icons are in `large` size and inherit color from a `color` style of current container.
You can change it by passing some extra props:
```typescript jsx
<Car color='red' size='small'/>
```

Icons can also inherit their size from parent context. To achieve that, pass `size='auto'` prop to it
```typescript jsx
<Car size='auto'/> // width = height = 1em
```
