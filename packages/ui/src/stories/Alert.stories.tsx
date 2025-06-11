import React from 'react'

import { Alert, Button, Space } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

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

export const AlertWithExpandableDescriptionAndAction: StoryObj<typeof Alert> = {
    args: {
        type: 'warning',
        maxLines: 3,
        showLessText: 'Show less text',
        showMoreText: 'Show more text',
        description: 'Super long description example Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tristique a nunc at blandit. Aliquam viverra sem a odio semper, sed ultricies purus commodo. Proin sit amet metus vehicula, volutpat mauris pharetra, malesuada lectus. Etiam ultrices leo est, at hendrerit nisi blandit ac. Aenean eleifend, urna vitae elementum dignissim, est erat volutpat nisi, vitae blandit dolor massa eget felis. Sed molestie dui quis turpis pulvinar, non viverra tellus suscipit. Sed a posuere turpis. Ut purus tellus, vehicula a lobortis et, tristique eu nunc.',
        action: (
            <Space size={16} wrap width='100%'>
                <Button type='secondary'>
                    Cancel
                </Button>
                <Button type='primary'>
                    Save
                </Button>
            </Space>
        ),
    },
}


export const Banner: StoryObj<typeof Alert> = {
    args: {
        type: 'info',
        banner: true,
        action: (
            <Space size={16} wrap width='100%'>
                <Button type='secondary'>
                    Cancel
                </Button>
                <Button type='primary'>
                    Save
                </Button>
            </Space>
        ),
    },
}