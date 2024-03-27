import { ComponentMeta, Story } from '@storybook/react'
import React from 'react'

import { ProgressIndicator, ProgressIndicatorProps, ProgressIndicatorStep } from '@open-condo/ui/src'

type MetaProps = {
    firstStep: ProgressIndicatorStep,
    secondStep: ProgressIndicatorStep | undefined,
    thirdStep: ProgressIndicatorStep | undefined,
    fourthStep: ProgressIndicatorStep | undefined,
}

const stepMeta = {
    control: 'select',
    options: [undefined, 'todo', 'completed', 'waiting'],
}

export default {
    title: 'Components/ProgressIndicator',
    component: ProgressIndicator,
    args: {
        disabled: false,
        firstStep: 'todo',
    },
    argTypes: {
        firstStep: {
            control: 'select',
            options: ['todo', 'completed', 'waiting'],
            defaultValue: 'todo',
        },
        secondStep: stepMeta,
        thirdStep: stepMeta,
        fourthStep: stepMeta,
        disabled: {
            control: 'select',
            options: [true, false],
        },
    },
} as ComponentMeta<typeof ProgressIndicator>

const Template: Story<ProgressIndicatorProps & MetaProps> = (props) => {
    const { firstStep, secondStep, thirdStep, fourthStep, ...rest } = props
    const steps: ProgressIndicatorProps['steps'] = [firstStep, secondStep, thirdStep, fourthStep]

    return (
        <ProgressIndicator {...rest} steps={steps}/>
    )
}

export const SimpleProgressIndicator = Template.bind({})
SimpleProgressIndicator.args = {}