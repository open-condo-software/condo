import React from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { Space, Typography } from '@open-condo/ui/src'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Typography',
    component: Typography.Link,
    argTypes: {
        children: { type: 'string' },
        size: {
            options: [undefined, 'large', 'medium', 'small'],
            mapping: ['undefined', 'large', 'medium', 'small'],
            control: 'select',
        },
        title: { type: 'string' },
        disabled: { type: 'boolean' },
    },
    args: {
        children: 'Inline link',
        title: 'Magic hover text',
        disabled: false,
    },
} as Meta<typeof Typography.Link>

const Template: StoryFn<typeof Typography.Link> = (args) => {
    const { children, ...restArgs } = args
    return (
        <Space direction='vertical' size={20}>
            <Typography.Link {...restArgs}>
                <Space size={8} direction='horizontal'>
                    <ArrowLeft size='small' />
                    <Typography.Text type='inherit'>{children}</Typography.Text>
                </Space>
            </Typography.Link>
            <Typography.Link {...args} />
            <Typography.Text>
                <Typography.Link {...args} /> inside large text
            </Typography.Text>
            <Typography.Text size='medium' type='secondary'>
                <Typography.Link {...args} /> inside medium text
            </Typography.Text>
            <Typography.Text size='small'>
                <Typography.Link {...args} /> inside small text
            </Typography.Text>
        </Space>
    )
}

export const Link: StoryObj<typeof Typography.Link> = {
    render: Template,
}
