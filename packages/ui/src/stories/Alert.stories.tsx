import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Alert } from '@open-condo/ui/src'

export default {
    title: 'Components/Alert',
    component: Alert,
    args: {
        type: 'success',
        message: 'Message',
        showIcon: true,
        description: 'Description',
    },
} as ComponentMeta<typeof Alert>

const Template: ComponentStory<typeof Alert> = (props) => <Alert {...props}/>

export const Success = Template.bind({})
Success.args = {
    type: 'success',
}
export const Info = Template.bind({})
Info.args = {
    type: 'info',
}
export const Warning = Template.bind({})
Warning.args = {
    type: 'warning',
}
export const Error = Template.bind({})
Error.args = {
    type: 'error',
}