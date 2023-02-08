import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Select as Component, Option, OptGroup, Typography, Space, SelectProps } from '@open-condo/ui/src'

const AVAILABLE_TYPES: Array<SelectProps['type']> = [
    undefined,
    'success',
    'warning',
    'danger',
    'info',
    'secondary',
]

export default {
    title: 'Components/Select',
    component: Component,
    args: {
        options: [{ label: 'First label', value: 1 }, { label: 'Second label', value: 2 }],
        placeholder: 'Choose an option',
        disabled: false,
    },
    argTypes: {
        placeholder: { type: 'string' },
        disabled: { type: 'boolean', defaultValue: false },
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
const MultipleTemplate: ComponentStory<typeof Component> = (props) => (
    <Space direction='horizontal' size={20} wrap>
        {AVAILABLE_TYPES.map((type, index) => (
            <Component key={index} {...props} type={type} />
        ))}
    </Space>
)

export const Default = Template.bind({})
Default.args = {}

export const CustomContent = Template.bind({})
CustomContent.args = {
    displayMode: 'fit-content',
    options: undefined,
    children: <>
        <Option key='1' value={1}>
            <Typography.Text size='medium' type='danger'>Some custom content</Typography.Text>
        </Option>
        <Option key='2' value={2}>
            <Typography.Text size='medium' type='success'>Another custom content</Typography.Text>
        </Option>
    </>,
}

export const CustomTypes = MultipleTemplate.bind({})
CustomTypes.args = {
    value: 1,
}

export const GroupsContent = Template.bind({})
GroupsContent.args = {
    options: undefined,
    children: <>
        <Option value={0}>Option without group</Option>
        <OptGroup key='group1' label='Group 1'>
            <Option key={1} value={1}>Group 1 option 1</Option>
            <Option key={11} value={11}>Group 1 option 2</Option>
        </OptGroup>
        <OptGroup key='group2' label='Group 2'>
            <Option key={2} value={2}>Group 2 option 1</Option>
            <Option key={22} value={22}>Group 2 option 2</Option>
        </OptGroup>
    </>,
}
