import React from 'react'

import { Space as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Space',
    component: Component,
    args: {
        direction: 'vertical',
        children: Array.from({ length: 5 }, (_, index) => (
            <span key={index}>Child {index}</span>
        )),
        size: 8,
        wrap: false,
    },
    argTypes: {
        direction: {
            control: 'select',
            options: [undefined, 'vertical', 'horizontal'],
            mapping: ['vertical', 'horizontal'],
        },
        size: {
            control: 'select',
            options: [8, 12, 16, 20, 24, 40, 52, 60],
            mapping: [8, 12, 16, 20, 24, 40, 52, 60],
        },
        wrap: { control: 'boolean' },
    },
} as Meta<typeof Component>

export const Vertical: StoryObj<typeof Component> = {
    args: {
        direction: 'vertical',
        size: 20,
    },
}

export const Horizontal: StoryObj<typeof Component> = {
    args: {
        direction: 'horizontal',
        size: 20,
    },
}
