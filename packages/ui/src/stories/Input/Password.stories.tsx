import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Input } from '@open-condo/ui/src'

export default {
    title: 'Components/Input',
    component: Input.Password,
    args: {
        placeholder: 'Placeholder',
        disabled: false,
    },
} as ComponentMeta<typeof Input.Password>

const Template: ComponentStory<typeof Input.Password> = (props) => <Input.Password {...props}/>

export const Password = Template.bind({})
