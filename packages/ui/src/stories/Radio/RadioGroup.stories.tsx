import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { FileText } from '@open-condo/icons'
import { RadioGroup as Component, Radio, Space, Typography } from '@open-condo/ui/src'

const { ItemGroup } = Component
const SPACE_WIDTH = 500

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
        disabled: {
            control: { type: 'select' },
            options: [undefined, true, false],
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props} />

const radioGroupButtonTemplateArgs = [
    { title: 'Default', customProps: { value: 'value 1' } },
    { title: 'Disabled', customProps: { disabled: true } },
    {
        title: 'Label with icon',
        customProps: { children: Array.from({ length: 3 }, (_, i) => (
            <Radio label={(i + 1).toString()} value={i} icon={<FileText size='small' />} />
        )) },
    },
    {
        title: 'Only with icon',
        customProps: { children: Array.from({ length: 3 }, (_, i) => (
            <Radio value={i} icon={<FileText size='small' />} />
        )) },
    },
]
const RadioGroupButtonTemplate: ComponentStory<typeof Component> = (props) => <>
    <Space direction='vertical' size={20} width={SPACE_WIDTH}>
        {
            radioGroupButtonTemplateArgs.map((templateArgs, key) => (
                <Space key={key} direction='vertical' size={8} width={SPACE_WIDTH}>
                    <Typography.Text>{templateArgs.title}</Typography.Text>
                    <Component {...props} {...templateArgs.customProps} />
                </Space>
            ))
        }
    </Space>
</>

export const RadioGroup = Template.bind({})
RadioGroup.args = {
    children: <Space direction='vertical' size={12}>
        <Radio label='Group option 1' value='value 1' />
        <Radio label='Group option 2' value='value 2' />
    </Space>,
}

export const RadioGroupButtonType = RadioGroupButtonTemplate.bind({})
RadioGroupButtonType.args = {
    optionType: 'button',
    children: <>
        <Radio label='Group option 1' value='value 1' />
        <Radio label='Group option 2' value='value 2' />
        <Radio label='Group option 3' value='value 3' />
    </>,
}


export const ManyRadioGroups = Template.bind({})
ManyRadioGroups.args = {
    children: <>{[
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
    ].map(group => (
        <ItemGroup name={group.name} options={group.options} key={group.name} />
    ))}</>,
}
