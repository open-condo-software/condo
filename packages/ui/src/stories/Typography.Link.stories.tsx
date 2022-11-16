import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Typography } from '@open-condo/ui/src'

// TODO(DOMA-4682): Move to UI-kit
import { Space } from 'antd'
import 'antd/lib/space/style/index.less'

export default {
    title: 'Components/Typography',
    component: Typography.Link,
    argTypes: {
        children: { type: 'string', defaultValue: 'Inline link' },
        size: {
            defaultValue: 'undefined',
            options: [undefined, 'lg', 'md', 'sm'],
            mapping: ['undefined', 'lg', 'md', 'sm'],
            control: 'select',
        },
        title: { type: 'string', defaultValue: 'Magic hover text' },
        disabled: { type: 'boolean', defaultValue: false },
    },
} as ComponentMeta<typeof Typography.Link>

const Template: ComponentStory<typeof Typography.Link> = (args) => {
    return (
        <Space direction='vertical' size={20} prefixCls='condo-space'>
            <Typography.Link {...args}/>
            <Typography.Text>
                <Typography.Link {...args}/>
                {' '}
                inside large text
            </Typography.Text>
            <Typography.Text size='md' type='secondary'>
                <Typography.Link {...args}/>
                {' '}
                inside medium text
            </Typography.Text>
            <Typography.Text size='sm'>
                <Typography.Link {...args}/>
                {' '}
                inside small text
            </Typography.Text>
        </Space>
    )
}

export const Link = Template.bind({})