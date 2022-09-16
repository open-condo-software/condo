import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { DeleteFilled, EditFilled } from '@ant-design/icons'
import { Button } from '@condo/ui'

const icons = {
    DeleteFilled: <DeleteFilled/>,
    EditFilled: <EditFilled/>,
}

export default {
    title: 'Components/Button',
    component: Button,
    args: {
        children: 'Label',
        type: 'primary',
        disabled: false,
        danger: false,
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
                    EditFilled: 'Edit',
                },
            },
        },
        onClick: { control: false },
        href: { control: false },
        target: { control: false },
        htmlType: { defaultValue: 'button' },
    },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (props) => <Button {...props}/>

export const Primary = Template.bind({})
Primary.args = {
    type: 'primary',
}
export const Secondary = Template.bind({})
Secondary.args = {
    type: 'secondary',
}