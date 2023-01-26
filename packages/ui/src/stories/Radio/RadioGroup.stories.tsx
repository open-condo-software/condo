import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { ChevronDown } from '@open-condo/icons'
import { RadioGroup as Component } from '@open-condo/ui/src'

const icons = {
    ChevronDown: <ChevronDown size='small' />,
}

export default {
    title: 'Components/Radio',
    component: Component,
    args: {
        icon: <ChevronDown size='small' />,
        groups: [
            {
                name: 'Group 1',
                options: [{ label: 'Group option 1', value: 'value 1' }, { label: 'Group option 2', value: 'value 2' }],
            },
            {
                name: 'Group 2',
                options: [{ label: 'Group option 3', value: 'value 3' }, { label: 'Group option 4', value: 'value 4' }],
            },
            {
                name: 'Group 3',
                options: [{ label: 'Group option 5', value: 'value 5' }, { label: 'Group option 6', value: 'value 6' }],
            },
        ],
    },
    argTypes: {
        onChange: {
            table: {
                type: {
                    summary: 'MouseEventHandler<HTMLElement>',
                },
            },
            control: {
                type: null,
            },
        },
        icon:{
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
                labels: {
                    ChevronDown: 'Down arrow',
                },
            },
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props} />

export const RadioGroup = Template.bind({})
RadioGroup.args = {}
