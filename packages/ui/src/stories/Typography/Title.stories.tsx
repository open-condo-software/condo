import { ComponentStory, ComponentMeta } from '@storybook/react'
import { styled } from '@storybook/theming'
import get from 'lodash/get'
import React from 'react'

import { Space } from '@open-condo/ui/src'
import { Typography } from '@open-condo/ui/src'
import type { TypographyTitleProps } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'


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
            options: ['primary', 'inverted', 'secondary', 'info', 'success', 'warning', 'danger'],
            mapping: [undefined, 'inverted', 'secondary', 'info', 'success', 'warning', 'danger'],
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
        <Space direction='vertical' size={20}>
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
