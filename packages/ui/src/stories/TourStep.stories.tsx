import { ComponentStory, ComponentMeta } from '@storybook/react'
import React, { useEffect, useState } from 'react'

import { Button, Input, Space, Tour } from '@open-condo/ui/src'


const Component = Tour.TourStep

export default {
    title: 'Components/TourStep',
    component: Component,
    args: {
        title: 'Title',
        message: 'Hint text that describes something in detail, it may take several lines and then the component height will increase',
    },
    argTypes: {
        placement: {
            control: { type: 'select' },
            options: ['top', 'left', 'right', 'bottom'],
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => {
    const [inputValue, setInputValue] = useState<string>('')
    const { currentStep, setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        if (!setCurrentStep) return

        setCurrentStep(inputValue ? 1 : 0)
    }, [currentStep, inputValue, setCurrentStep])

    return (
        <Space size={20} direction='vertical'>
            <Component {...args} step={0}>
                <Input
                    placeholder='Input here'
                    onChange={e => setInputValue(e.target.value)}
                />
            </Component>
            <Component {...args} step={1}>
                <Button type='primary'>
                    Submit
                </Button>
            </Component>
        </Space>
    )
}

const TourStory: ComponentStory<typeof Component> = (args) => (
    <Tour.Provider>
        <Template {...args} />
    </Tour.Provider>
)

export const Simple = TourStory.bind({})
Simple.decorators = [
    (Story) => (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Story/>
        </div>
    ),
]