import { Switch as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Switch',
    component: Component,
    args: {
        disabled: false,
        size: 'large',
    },
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['large', 'small'],
        },
    },
} as Meta<typeof Component>

export const Simple: StoryObj<typeof Component> = {
    args: {},
}
