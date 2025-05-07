import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Button } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

const Component = Button.Text

const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
    [`${key}-medium`]: <Icon size='medium'/>,
    [`${key}-large`]: <Icon size='large'/>,
})))

export default {
    title: 'Components/Button',
    component: Component,
    args: {
        children: 'Label',
        type: 'primary',
        disabled: false,
        danger: false,
        stateless: false,
        block: false,
        focus: false,
        htmlType: 'button',
    },
    argTypes: {
        block: { type: 'boolean' },
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
} as Meta<typeof Component>

export const TextButton: StoryObj<typeof Component> = {}
