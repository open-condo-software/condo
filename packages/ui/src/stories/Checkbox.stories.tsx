import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Checkbox as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Checkbox',
    component: Component,
    args: {
        children: 'Label',
        disabled: false,
        autoFocus: false,
        defaultChecked: false,
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

export const Checkbox = Template.bind({})