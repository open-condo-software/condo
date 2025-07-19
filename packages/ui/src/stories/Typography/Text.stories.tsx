import get from 'lodash/get'
import React from 'react'
import { styled } from 'storybook/theming'

import { Typography, Space } from '@open-condo/ui/src'
import type { TypographyTextProps } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

const getArticle = (str?: string) => {
    if (!str) return 'a'
    const firstChar = str[0]
    if (!firstChar) return 'a'
    return firstChar.match('a|e|i|o|u/i') ? 'an' : 'a'
}

const AVAILABLE_TYPES: Array<TypographyTextProps['type']> = [
    'primary',
    'secondary',
    'inverted',
    'danger',
    'warning',
    'info',
    'success',
    'inherit',
]

const AVAILABLE_MODES = [
    'disabled',
    'code',
    'strong',
    'italic',
    'underline',
    'delete',
]

const InvertedBackground = styled.span`
  background: ${colors.black};
`

export default {
    title: 'Components/Typography',
    component: Typography.Text,
    argTypes: {
        children: { type: 'string' },
        size: {
            options: [undefined, 'large', 'medium', 'small'],
            mapping: ['undefined', 'large', 'medium', 'small'],
            control: 'select',
        },
        direction: {
            options: [undefined, 'ltr', 'rtl'],
            mapping: ['undefined', 'ltr', 'rtl'],
            control: 'select',
        },
    },
} as Meta<typeof Typography.Text>

const Template: StoryFn<typeof Typography.Text> = (args) => {
    return (
        <Space direction='vertical' size={20}>
            {AVAILABLE_TYPES.map((type) => {
                const text =
          get(args, 'children') ||
          `This is an example of ${getArticle(type)} ${type || 'default'} text.`
                const props = {
                    ...args,
                    children: text,
                    type,
                }
                if (type === 'inverted') {
                    return (
                        <InvertedBackground>
                            <Typography.Text {...props} />
                        </InvertedBackground>
                    )
                }
                return <Typography.Text key={String(type)} {...props} />
            })}
            <hr />
            {AVAILABLE_MODES.map((mode) => {
                const text =
          get(args, 'children') ||
          `This is an example of ${getArticle(mode)} ${mode} text.`
                const props = {
                    ...args,
                    [mode]: true,
                    children: text,
                }
                return <Typography.Text key={mode} {...props} />
            })}
        </Space>
    )
}

export const Text: StoryObj<typeof Typography.Paragraph> = {
    render: Template,
}
