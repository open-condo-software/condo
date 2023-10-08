import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Space } from '@open-condo/ui/src'
import { Typography } from '@open-condo/ui/src'

export default {
    title: 'Components/Typography',
    component: Typography.Link,
    argTypes: {
        children: { type: 'string', defaultValue: 'Inline link' },
        size: {
            defaultValue: 'undefined',
            options: [undefined, 'large', 'medium', 'small'],
            mapping: ['undefined', 'large', 'medium', 'small'],
            control: 'select',
        },
        title: { type: 'string', defaultValue: 'Magic hover text' },
        disabled: { type: 'boolean', defaultValue: false },
    },
} as ComponentMeta<typeof Typography.Link>

const Template: ComponentStory<typeof Typography.Link> = (args) => {
    return (
        <Space direction='vertical' size={20}>
            <Typography.Link {...args}/>
            <Typography.Text>
                <Typography.Link {...args}/>
                {' '}
                inside large text
            </Typography.Text>
            <Typography.Text size='medium' type='secondary'>
                <Typography.Link {...args}/>
                {' '}
                inside medium text
            </Typography.Text>
            <Typography.Text size='small'>
                <Typography.Link {...args}/>
                {' '}
                inside small text
            </Typography.Text>
        </Space>
    )
}

export const Link = Template.bind({})
