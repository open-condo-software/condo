import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { RadioGroup as Component, Radio, Space } from '@open-condo/ui/src'

export default {
    title: 'Components/Radio',
    component: Component,
    args: {},
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
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props} />

export const RadioGroup = Template.bind({})
RadioGroup.args = {
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
}

export const CustomRadioGroup = Template.bind({})
CustomRadioGroup.args = {
    children: <Space direction='vertical' size={12}>
        <Radio label='Group option 1' value='value 1' />
        <Radio label='Group option 2' value='value 2' />
    </Space>,
}
