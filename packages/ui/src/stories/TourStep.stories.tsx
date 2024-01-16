import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Button, Input, Space, TourStep as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/TourStep',
    component: Component,
    args: {
        title: 'Title',
        message: 'Hint text that describes something in detail, it may take several lines and then the component height will increase',
        currentStep: 0,
    },
    argTypes: {
        placement: {
            control: { type: 'select' },
            options: ['top', 'left', 'right', 'bottom'],
        },
        currentStep: {
            control: { type: 'select' },
            options: [0, 1],
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => (
    <Space size={20} direction='vertical'>
        <Component {...args} step={0}>
            <Input placeholder='Input here' />
        </Component>
        <Component {...args} step={1}>
            <Button type='primary'>
                Submit
            </Button>
        </Component>
    </Space>
)

export const Simple = Template.bind({})
Simple.decorators = [
    (Story) => (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Story/>
        </div>
    ),
]