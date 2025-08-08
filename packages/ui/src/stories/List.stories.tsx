import { List as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/List',
    component: Component,
    args: {
        dataSource: [
            { label: 'Some label', value: '123', valueTextType: 'danger' },
            {
                label: 'Another label',
                value: 'Lorem ipsum dolor',
                valueTextType: 'info',
            },
            {
                label:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
                value:
          'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
            },
        ],
        title: 'List title',
    },
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['default', 'small', 'large'],
        },
    },
} as Meta<typeof Component>

export const List: StoryObj<typeof Component> = {}
