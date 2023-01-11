[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/ui?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/ui

# `@open-condo/ui` [![NPM][npm-badge-link]][npm-pkg-link]
> A set of React UI components for developing applications inside the condo ecosystem

## Table of contents
[Installation](#installation)\
[Usage](#usage)\
[Including styles](#including-styles)\
[Access theme colors](#access-theme-colors)

## Installation
To install package simply run the following command if you're using npm as your package manager:
```bash
npm i @open-condo/ui
```
or it's yarn alternative
```bash
yarn add @open-condo/ui
```

## Usage
You can import needed component with its props directly from package entry point like this:
```typescript
import { Button } from '@open-condo/ui'
import type { ButtonProps } from '@open-condo/ui'
```

## Including styles
To apply the styles, import the css file from library `dist` into your project root component:
```typescript jsx
import '@open-condo/ui/dist/styles.min.css'
```

## Access theme colors
You also can directly access to all our theme colors as well
by specifying import sub path like this:
```typescript
import { colors } from '@open-condo/ui/colors'
import type { ColorPalette } from '@open-condo/ui/colors'
```
