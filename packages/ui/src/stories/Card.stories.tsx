import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Card as Component, Typography } from '@open-condo/ui/src'

export default {
    title: 'Components/Card',
    component: Component,
    args: {
        width: 400,
        hoverable: true,
        active: false,
        disabled: false,
        children: 'A decision tree is a decision support tool that uses a tree-like model of decisions and their possible consequences, including chance event outcomes, resource costs, and utility. It is one way to display an algorithm that only contains conditional control statements.  Decision trees are commonly used in operations research, specifically in decision analysis, to help identify a strategy most likely to reach a goal, but are also a popular tool in machine learning.',
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = ({ children, ...rest }) => {
    return (
        <Component
            {...rest}
        >
            <Typography.Paragraph ellipsis={{ rows: 3 }}>
                {children}
            </Typography.Paragraph>
        </Component>
    )
}

export const Simple = Template.bind({})
export const WithTitle = Template.bind({})
export const Active = Template.bind({})
export const ActiveWithTitle = Template.bind({})
WithTitle.args = {
    title: <Typography.Title level={3}>Some Title Content</Typography.Title>,
}
WithTitle.argTypes = {
    title: { control: false },
}
Active.args = {
    active: true,
}
ActiveWithTitle.args = {
    title: <Typography.Title level={3}>Some Title Content</Typography.Title>,
    titlePadding: 24,
    active: true,
}