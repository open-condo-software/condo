import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Checkbox as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Checkbox',
    component: Component,
    args: {
        checked: false,
        disabled: false,
        autoFocus: false,
        defaultChecked: false,
        indeterminate: false,
        label: 'Label',
    },
    argTypes: {
        onChange: {
            table: {
                type: { 
                    summary: 'MouseEventHandler<HTMLElement>',
                },
            },
            control: {
                type: null,
            },
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props}/>

export const Unchecked = Template.bind({})
Unchecked.args = {
    defaultChecked: false,
}
export const Checked = Template.bind({})
Checked.args = {
    checked: true,
}
export const Disabled = Template.bind({})
Disabled.args = {
    checked: true,
    disabled: true,
}
export const BoldText = Template.bind({})
BoldText.args = {
    labelProps: { strong: true },
}
