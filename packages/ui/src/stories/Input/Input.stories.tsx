import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Input as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Input',
    component: Component,
    args: {
        placeholder: 'Placeholder',
        disabled: false,
        allowClear: false,
        suffix: '',
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props}/>

export const Input = Template.bind({})
