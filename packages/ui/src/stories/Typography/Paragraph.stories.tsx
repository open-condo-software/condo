import get from 'lodash/get'
import React from 'react'
import { styled } from 'storybook/theming'

import { Typography } from '@open-condo/ui/src'
import type { TypographyParagraphProps } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

const AVAILABLE_TYPES: Array<TypographyParagraphProps['type']> = [
    'primary',
    'secondary',
    'inverted',
    'danger',
    'warning',
    'info',
    'success',
    'inherit',
]

const InvertedBackground = styled.div`
  background: ${colors.black};
`

const DEFAULT_PARAGRAPH_TEXT =
  'Statistics is a branch of mathematics. It involves gathering information, summarizing it, and deciding what it means. The numbers that result from this work are also called statistics. They can help to predict such things as the weather and how sports teams will perform. They also can describe specific things about large groups of people—for example, the reading level of students, the opinions of voters, or the average weight of a city’s residents.'

export default {
    title: 'Components/Typography',
    component: Typography.Paragraph,
    argTypes: {
        children: { type: 'string' },
        size: {
            options: [undefined, 'large', 'medium', 'small'],
            mapping: ['undefined', 'large', 'medium', 'small'],
            control: 'select',
        },
        amount: {
            type: 'number',
            control: {
                type: 'range',
                min: 1,
                max: 5,
            },
        },
        type: {
            options: AVAILABLE_TYPES,
            control: 'select',
        },
    },
    args: {
        children: DEFAULT_PARAGRAPH_TEXT,
        amount: 2,
    },
} as Meta<typeof Typography.Paragraph>

const Template: StoryFn<typeof Typography.Paragraph> = (args) => {
    const amount = get(args, 'amount')
    const Wrapper =
    args.type === 'inverted' ? InvertedBackground : React.Fragment

    return (
        <>
            <Wrapper>
                {[...Array(amount).keys()].map((index) => (
                    <Typography.Paragraph key={index} {...args} />
                ))}
            </Wrapper>
        </>
    )
}

export const Paragraph: StoryObj<typeof Typography.Paragraph> = {
    render: Template,
}
