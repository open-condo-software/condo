import React from 'react'
import get from 'lodash/get'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Title as Component } from '@open-condo/ui/src'
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
    component: Component,
    args: {
        type: 'default',
    },
    argTypes: {
        children: { type: 'string' },
        type: {
            options: ['default', 'inverted'],
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
} as ComponentMeta<typeof Component>

const TitleTemplate: ComponentStory<typeof Component> = (args) => {
    const levels: Array<TypographyTitleProps['level']> = [1, 2, 3, 4, 5, 6]

    return (
        <Space direction='vertical' size={20} prefixCls='condo-space'>
            {levels.map(level => {
                const text = get(args, 'children') || `H${level}: This is an example of a level ${level} title.`
                return (
                    <Component key={level} {...args} level={level} children={text}/>
                )
            })}
        </Space>
    )
}

export const Title = TitleTemplate.bind({})