import React from 'react'
import get from 'lodash/get'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Typography } from '@open-condo/ui/src'
import type { TypographyTitleProps } from '@open-condo/ui/src'
import { styled } from '@storybook/theming'
import { colors } from '../colors'

// TODO(DOMA-4682): Move to UI-kit
import { Space } from 'antd'
import 'antd/lib/space/style/index.less'

const StoryDecorator = styled.div<{ bg: 'light' | 'dark' }>`
  background: ${(props) => props.bg === 'light' ? colors.white : colors.black};
`

export default {
    title: 'Components/Typography',
    component: Typography.Title,
    argTypes: {
        children: { type: 'string' },
        type: {
            defaultValue: 'default',
            options: ['default', 'inverted'],
            mapping: [undefined, 'inverted'],
            control: 'select',
        },
    },
    decorators: [
        (Story, options) => (
            <StoryDecorator bg={options.args.type === 'inverted' ? 'dark' : 'light'}>
                <Story/>
            </StoryDecorator>
        ),
    ],
} as ComponentMeta<typeof Typography.Title>

const Template: ComponentStory<typeof Typography.Title> = (args) => {
    const levels: Array<TypographyTitleProps['level']> = [1, 2, 3, 4, 5, 6]

    return (
        <Space direction='vertical' size={20} prefixCls='condo-space'>
            {levels.map(level => {
                const text = get(args, 'children') || `H${level}: This is an example of a level ${level} title.`
                return (
                    <Typography.Title key={level} {...args} level={level} children={text}/>
                )
            })}
        </Space>
    )
}

export const Title = Template.bind({})