import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Radio as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Radio',
    component: Component,
    args: {
        checked: false,
        defaultChecked: false,
        disabled: false,
        autoFocus: false,
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
        checked: {
            control: 'boolean',
            if: { arg: 'indeterminate', truthy: false },
        },
        labelProps: {
            if: { arg: 'label' },
        },
        defaultChecked: {
            control: 'boolean',
            if: { arg: 'indeterminate', truthy: false },
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props} />

export const Unchecked = Template.bind({})
Unchecked.args = {
    defaultChecked: false,
}

export const Checked = Template.bind({})
Checked.args = {
    checked: true,
    autoFocus: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
    disabled: true,
}

export const BoldText = Template.bind({})
BoldText.args = {
    labelProps: { strong: true },
}
