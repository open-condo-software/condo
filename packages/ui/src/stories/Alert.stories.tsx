import { Meta } from '@storybook/react'

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
} as Meta<typeof Alert>
 
export const SuccessAlert = {
    args: {
        type: 'success',
    },
}

export const InfoAlert = {
    args: {
        type: 'info',
    },
}

export const WarningAlert = {
    args: {
        type: 'warning',
    },
}

export const ErrorAlert = {
    args: {
        type: 'error',
    },
}
