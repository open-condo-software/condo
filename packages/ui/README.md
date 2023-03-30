[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/ui?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/ui

# `@open-condo/ui` [![NPM][npm-badge-link]][npm-pkg-link]
> A set of React UI components for developing applications inside the condo ecosystem

## Table of contents
[Installation](#installation)\
[Usage](#usage)\
[Including styles](#including-styles)\
[Access theme colors](#access-theme-colors)\
[Style-variables](#style-variables)\
[Hooks](#hooks)

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
You can also directly access to all our theme colors
by specifying import sub path like this:
```typescript
import { colors } from '@open-condo/ui/colors'
import type { ColorPalette } from '@open-condo/ui/colors'
```

## Style variables
Style tokens are available for import as well:
- CSS Variables:
```typescript
import '@open-condo/ui/style-vars/css'
```
- Less Variables
```less
@import (reference) "@open-condo/ui/style-vars/less";
```

```less
@import (reference) "@open-condo/ui/dist/style-vars/variables.less";
```

## Hooks
Hooks can be imported as follows:
```js
import { useBreakpoints, useContainerSize } from '@open-condo/ui/hooks';
```
- `useBreakpoints` - returns the breakpoint object and its current value. 
Breakpoint value becomes `true` if the window width is greater than or equal to the corresponding breakpoint.
The name and width of the breakpoints:
  - `MOBILE_SMALL` (0px)
  - `MOBILE_LARGE` (360px) 
  - `TABLET_SMALL` (480px) 
  - `TABLET_LARGE` (768px)
  - `DESKTOP_SMALL` (992px)
  - `DESKTOP_LARGE` (1200px)
```js
const breakpoints = useBreakpoints()

// window width >= 480px and < 992px
const isTablet = breakpoints.TABLET_SMALL && !breakpoints.DESKTOP_SMALL
```

- `useContainerSize` provides the dimensions of a specific container.
```js
const [{ width, height }, setRef] = useContainerSize()

console.log(width, height)

return <div ref={setRef} />
```
