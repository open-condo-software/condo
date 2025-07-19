import React from 'react'

import { Tooltip as Component, Typography } from '@open-condo/ui/src'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Tooltip',
    component: Component,
    args: {
        title: 'Some text',
    },
    argTypes: {
        placement: {
            control: { type: 'select' },
            options: [
                'top',
                'left',
                'right',
                'bottom',
                'topLeft',
                'topRight',
                'bottomLeft',
                'bottomRight',
                'leftTop',
                'leftBottom',
                'rightTop',
                'rightBottom',
            ],
        },
        open: {
            control: { type: 'select' },
            options: [undefined, true, false],
        },
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = (args) => (
    <Component {...args}>
        <Typography.Text>Hover me</Typography.Text>
    </Component>
)

export const Simple: StoryObj<typeof Component> = {
    render: Template,
    decorators: (StoryFn) => (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <StoryFn />
        </div>
    ),
}

export const Long: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title:
      'A UI-kit is a set of design elements and guidelines that help create a consistent and visually appealing user interface. It is important in web design as it ensures that the website has a cohesive look and feel, which in turn enhances user experience. By using a UI-kit, designers can save time by not having to create design elements from scratch, and can focus on creating intuitive and user-friendly interfaces. In summary, a UI-kit is an essential tool for web designers to create visually cohesive and user-friendly interfaces.',
        placement: 'bottom',
        open: true,
    },
    decorators: (StoryFn) => (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <StoryFn />
        </div>
    ),
}
