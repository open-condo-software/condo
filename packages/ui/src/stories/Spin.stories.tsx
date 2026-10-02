import { Spin as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Spin',
    component: Component,
    args: {
        block: true,
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['large', 'medium'],
        },
    },
} as Meta<typeof Component>


export const Spin: StoryObj<typeof Component> = {}
