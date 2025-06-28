import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Button } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
    [`${key}-medium`]: <Icon size='medium'/>,
    [`${key}-large`]: <Icon size='large'/>,
})))

export default {
    title: 'Components/Button',
    component: Button,
    args: {
        children: 'Label',
        type: 'primary',
        disabled: false,
        size: 'large',
        compact: false,
        minimal: false,
        danger: false,
        stateless: false,
        block: false,
        focus: false,
        htmlType: 'button',
    },
    argTypes: {
        block: { type: 'boolean' },
        minimal: { type: 'boolean' },
        compact: { type: 'boolean' },
        size: {
            control: 'select',
            options: ['medium', 'large'],
        },
        type: { control: 'select' },
        icon: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
            },
        },
        onClick: { control: false },
        href: { control: false },
        target: { control: false },
        focus: { type: 'boolean' },
    },
} as Meta<typeof Button>

export const Primary: StoryObj<typeof Button> = {
    args: {
        type: 'primary',
    },
}

export const Secondary: StoryObj<typeof Button> = {
    args: {
        type: 'secondary',
    },
}


export const Accent: StoryObj<typeof Button> = {
    args: {
        type: 'accent',
    },
}
