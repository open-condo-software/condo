import { Markdown as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

const TS_CODE_EXAMPLE = `
\`\`\`typescript
// Some extra long comment line which main goal is to make horizontal scroll appear
import {
    Card as DefaultCard,
    CardProps as DefaultCardProps,
} from 'antd'
import React, { CSSProperties } from 'react'

const CARD_CLASS_PREFIX = 'condo-card'

export type CardProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
Pick<DefaultCardProps, 'hoverable' | 'title'> & {
    width?: CSSProperties['width']
    bodyPadding?: CSSProperties['padding']
    titlePadding?: CSSProperties['padding']
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
    const { width, bodyPadding = 24, titlePadding = 24, ...rest } = props
    return (
        <DefaultCard
            {...rest}
            style={{ width }}
            prefixCls={CARD_CLASS_PREFIX}
            ref={ref}
            bodyStyle={{ padding: bodyPadding }}
            headStyle={{ padding: titlePadding }}
        />
    )
})

Card.displayName = 'Card'

export {
    Card,
}
\`\`\`
`

const MD_EXAMPLE = `
# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Horizontal line
---

## Texts

This what default text will looks like. You can mark newline explicitly \\
by adding reverse slash or just...

use empty line to start a new paragraph.


However, you can make texts look **bold** in __2 different ways__.

Text can also be *italic* in _2 different ways_.

~Strikethrough~ modifiers are also ~~not~~ supported :)

## Links

You can specify some [inline links](https://www.npmjs.com/package/@open-condo/ui) without title 
or [with title](https://www.npmjs.com/package/@open-condo/ui "Wow, that title is really awesome!"),

Automatic link detection is enabled, so you can pass them directly like this: https://github.com/open-condo-software/condo

And you can also specify email directly: GoofyGoober@doma.ai

However, auto-detection is not working with phones: +79999999999, but you can still make it with regular link [+7 (999) 999–99–99](tel:+79999999999)

## Images
Images can be added in much the same way as links:\\
![My image](https://i.imgur.com/tVzxjWc.jpg "Wow, image have a title too!")

## Lists

Unordered

- Item can be created by starting a line with \`+\`, \`-\`, or \`*\`
- Second item
  - First sub-item
  * Second sub-item
    + Nested sub-item

Ordered

1. Wake up
2. Coffee
3. Code time
1. You can use sequential numbers
1. Or just use "ones"

However, ...

57. List can also be started 
1. with offset

## Checkboxes

- [ ] Non-checked checkbox
- [x] Checked checkbox

## Blockquotes

> Blockquotes can be specified with greater-than sign...
>> ...they also can be nested without spaces...
> > > ...or with spaces between arrows,

## Code 
You can also add \`inline code elements\` or multiline code blocks:
${TS_CODE_EXAMPLE}

\`\`\`bash
yarn dev
\`\`\`

\`\`\`
some code with no language
\`\`\`

## Tables

| Option | Description |
| ------ | ----------- |
| path   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |
`

export default {
    title: 'Components/Markdown',
    component: Component,
    args: {
        children: MD_EXAMPLE,
    },
} as Meta<typeof Component>

export const Markdown: StoryObj<typeof Component> = {}
