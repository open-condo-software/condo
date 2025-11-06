import React, { useState } from 'react'

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

const MD_EDITABLE_CHECKBOXES_EXAMPLE = `
## Interactive checkboxes playground
- [ ] Team Finance
- [x] Team Development
- [ ] Team Payments
- [ ] Team UI Kit
    - [ ] Chief of Inputs
    - [x] Typography Team
        - [ ] Queen of Headers
        - [x] Ace of quotes
        - [ ] King of paragraphs
        - [ ]       - [x] Ambassador of preformatted text
`

export default {
    title: 'Components/Markdown',
    component: Component,
    args: {
        children: MD_EXAMPLE,
    },
} as Meta<typeof Component>

// Story with interactive checkboxes
const InteractiveCheckboxesTemplate = (args: any) => {
    const [markdownState, setMarkdownState] = useState(args.children)

    return (
        <div>
            <h1>Markdown with Interactive Checkboxes:</h1>
            <Component
                {...args}
                children={markdownState}
                onCheckboxChange={setMarkdownState}
            />
            <h2>Current Markdown State:</h2>
            <pre style={{
                background: '#f5f5f5',
                padding: '16px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
            }}>
                {markdownState}
            </pre>
        </div>
    )
}

// Story with lite type
const LiteTemplate = (args: any) => {
    return (
        <div>
            <h1>Markdown with Lite Typography:</h1>
            <Component {...args} />
        </div>
    )
}

export const Default: StoryObj<typeof Component> = {}

export const WithInteractiveCheckboxes: StoryObj<typeof Component> = {
    render: InteractiveCheckboxesTemplate,
    args: {
        children: MD_EDITABLE_CHECKBOXES_EXAMPLE,
    },
}

export const Lite: StoryObj<typeof Component> = {
    render: LiteTemplate,
    args: {
        type: 'inline',
        children: `
# Header 1
## Header 2
### Header 3
#### Header 4

Inline markdown is a type of markdown inspired by popular messaging apps. It does not support any headers, and is supposed to be used where the platform needs to show text formatted by user  

Headers are supposed to be made as **bold text** like this:

**Header 1**

Paragraph text inside of this header

1. Guide to mental health  
  - If anxious
  - If depressed
  - If overworked
    1. Calm down 
    2. Code 
2. If this does not work, try Linux
3. Don't forget about staying hydrated, sleeping at least **8** hours per day and going to gym


**Header 2**

**Bold text** and *italic text* still work as intended.
        `,
    },
}

// You can also add a combined story to show both features
export const LiteWithInteractiveCheckboxes: StoryObj<typeof Component> = {
    render: InteractiveCheckboxesTemplate,
    args: {
        type: 'inline',
        children: MD_EDITABLE_CHECKBOXES_EXAMPLE,
    },
}