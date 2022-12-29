import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { List as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/List',
    component: Component,
    args: {
        dataSource: [
            { label: 'Some label', value: 123, valueType: 'danger' },
            { label: 'Another label', value: 'Lorem ipsum dolor', valueType: 'info' },
            {
                label: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
                value: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
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
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props} />

export const List = Template.bind({})
