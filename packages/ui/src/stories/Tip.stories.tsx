import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Button, Tip as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Tip',
    component: Component,
    args: {
        title: 'Title',
        message: 'Short description',
        open: true,
    },
    argTypes: {
        placement: {
            control: { type: 'select' },
            options: ['top', 'left', 'right', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'leftTop', 'leftBottom', 'rightTop', 'rightBottom'],
        },
        open: {
            control: { type: 'select' },
            options: [true, false],
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => (
    <Component {...args}>
        <Button type='primary'>
            Submit
        </Button>
    </Component>
)

export const Simple = Template.bind({})
Simple.decorators = [
    (Story) => (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Story/>
        </div>
    ),
]

export const Long = Template.bind({})
Long.args = {
    message: 'A UI-kit is a set of design elements and guidelines that help create a consistent and visually appealing user interface. It is important in web design as it ensures that the website has a cohesive look and feel, which in turn enhances user experience. By using a UI-kit, designers can save time by not having to create design elements from scratch, and can focus on creating intuitive and user-friendly interfaces. In summary, a UI-kit is an essential tool for web designers to create visually cohesive and user-friendly interfaces.',
}
Long.decorators = [
    (Story) => (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Story/>
        </div>
    ),
]
