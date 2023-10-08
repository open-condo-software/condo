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

export const SuccessAlert = Template.bind({})
SuccessAlert.args = {
    type: 'success',
}
export const InfoAlert = Template.bind({})
InfoAlert.args = {
    type: 'info',
}
export const WarningAlert = Template.bind({})
WarningAlert.args = {
    type: 'warning',
}
export const ErrorAlert = Template.bind({})
ErrorAlert.args = {
    type: 'error',
}