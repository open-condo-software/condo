## Table of contents
[Installation](#installation)\
[Usage](#usage)\
[Access theme colors](#access-theme-colors)\

## Installation
To install package simply run the following command if you're using npm as your package manager:
```bash
npm i @condo/ui
```
or it's yarn alternative
```bash
yarn add @condo/ui
```

## Usage
You can import needed component with its props directly from package entry point like this:
```typescript
import { Button, ButtonProps } from '@condo/ui'
```

## Access theme colors
You also can directly access to all themes as well as specific theme colors 
by specifying import sub path like this:
```typescript
import { defaultTheme } from '@condo/ui/themes'
```
```typescript
import { colors, gradients } from '@condo/ui/themes/default'
```
