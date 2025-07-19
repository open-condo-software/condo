import React from 'react'

import { Alert, Button, Space } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

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

export const SuccessAlert: StoryObj<typeof Alert> = {
    args: {
        type: 'success',
    },
}

export const InfoAlert: StoryObj<typeof Alert> = {
    args: {
        type: 'info',
    },
}

export const WarningAlert: StoryObj<typeof Alert> = {
    args: {
        type: 'warning',
    },
}

export const ErrorAlert: StoryObj<typeof Alert> = {
    args: {
        type: 'error',
    },
}

export const Banner: StoryObj<typeof Alert> = {
    args: {
        type: 'info',
        banner: true,
        action: (
            <Space size={16} wrap width='100%'>
                <Button type='secondary'>Cancel</Button>
                <Button type='primary'>Save</Button>
            </Space>
        ),
    },
}
