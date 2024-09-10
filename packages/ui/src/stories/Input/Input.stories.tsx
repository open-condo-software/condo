import { StoryFn, Meta } from '@storybook/react'
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
        prefix: '',
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = (props) => <Component {...props}/>

export const Input = Template.bind({})
