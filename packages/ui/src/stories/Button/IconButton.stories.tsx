import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Button } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

const Component = Button.Icon
const { Trash } = condoIcons

const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
    [`${key}-medium`]: <Icon size='medium'/>,
    [`${key}-large`]: <Icon size='large'/>,
})))

export default {
    title: 'Components/Button',
    component: Component,
    args: {
        children: <Trash size='medium' />,
        disabled: false,
        size: 'medium',
        htmlType: 'button',
    },
    argTypes: {
        size: { control: 'select', options: ['small', 'medium'] },
        children: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
            },
        },
        disabled: { control: 'boolean' },
        onClick: { control: false },
        href: { control: false },
        target: { control: false },
    },
} as Meta<typeof Component>

export const IconButton: StoryObj<typeof Component> = {}
