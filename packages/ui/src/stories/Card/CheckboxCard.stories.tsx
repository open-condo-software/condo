import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Card as Component, Typography } from '@open-condo/ui/src'

const CheckboxCard = Component.CheckboxCard

export default {
    title: 'Components/Card',
    component: CheckboxCard,
    args: {
        width: 400,
        disabled: false,
        children: 'A decision tree is a decision support tool that uses a tree-like model of decisions and their possible consequences, including chance event outcomes, resource costs, and utility. It is one way to display an algorithm that only contains conditional control statements.  Decision trees are commonly used in operations research, specifically in decision analysis, to help identify a strategy most likely to reach a goal, but are also a popular tool in machine learning.',
    },
} as ComponentMeta<typeof CheckboxCard>

const Template: ComponentStory<typeof CheckboxCard> = ({ children, ...rest }) => {
    return (
        <CheckboxCard
            {...rest}
        >
            <Typography.Paragraph ellipsis={{ rows: 3 }}>
                {children}
            </Typography.Paragraph>
        </CheckboxCard>
    )
}

export const WithCheckbox = Template.bind({})
WithCheckbox.args = {
    title: <Typography.Title level={3}>Some Title Content</Typography.Title>,
}