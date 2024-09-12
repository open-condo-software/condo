import { StoryFn, Meta } from '@storybook/react'
import React from 'react'

import { ArrowLeft } from '@open-condo/icons'
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
} as Meta<typeof Typography.Link>

const Template: StoryFn<typeof Typography.Link> = (args) => {
    const { children, ...restArgs } = args
    return (
        <Space direction='vertical' size={20}>
            <Typography.Link {...restArgs}>
                <Space size={8} direction='horizontal'>
                    <ArrowLeft size='small'/>
                    <Typography.Text type='inherit'>
                        {children}
                    </Typography.Text>
                </Space>
            </Typography.Link>
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
