import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { DeleteFilled, InfoCircleFilled } from '@ant-design/icons'
import { Alert } from '@open-condo/ui/src'

const icons = {
    DeleteFilled: <DeleteFilled/>,
    InfoCircleFilled: <InfoCircleFilled />,
}

export default {
    title: 'Components/Alert',
    component: Alert,
    args: {
        type: 'success',
        message: 'Message',
        showIcon: true,
        description: 'Description',
    },
    argTypes: {
        type: { control: 'select' },
        icon: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
                labels: {
                    DeleteFilled: 'Delete',
                    InfoCircleFilled: 'Info',
                },
            },
        },
        action: {
            table: {
                type: { 
                    summary: 'ReactNode',
                },
            },
            control: {
                type: null,
            },
        },
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