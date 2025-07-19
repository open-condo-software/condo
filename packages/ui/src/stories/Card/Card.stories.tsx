import React from 'react'

import { Card as Component, Typography } from '@open-condo/ui/src'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Card',
    component: Component,
    args: {
        width: 400,
        hoverable: true,
        accent: false,
        disabled: false,
        children:
      'A decision tree is a decision support tool that uses a tree-like model of decisions and their possible consequences, including chance event outcomes, resource costs, and utility. It is one way to display an algorithm that only contains conditional control statements.  Decision trees are commonly used in operations research, specifically in decision analysis, to help identify a strategy most likely to reach a goal, but are also a popular tool in machine learning.',
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = ({ children, ...rest }) => {
    return (
        <Component {...rest}>
            <Typography.Paragraph ellipsis={{ rows: 3 }}>
                {children}
            </Typography.Paragraph>
        </Component>
    )
}

export const Simple: StoryObj<typeof Component> = {
    render: Template,
}

export const WithTitle: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title: <Typography.Title level={3}>Some Title Content</Typography.Title>,
    },
    argTypes: {
        title: { control: false },
    },
}

export const Accent: StoryObj<typeof Component> = {
    render: Template,
    args: {
        accent: true,
    },
}

export const AccentWithTitle: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title: <Typography.Title level={3}>Some Title Content</Typography.Title>,
        titlePadding: 24,
        accent: true,
    },
}
