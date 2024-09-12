import { StoryFn, Meta } from '@storybook/react'
import React from 'react'

import { Input } from '@open-condo/ui/src'

export default {
    title: 'Components/Input',
    component: Input.Password,
    args: {
        placeholder: 'Placeholder',
        disabled: false,
    },
} as Meta<typeof Input.Password>

const Template: StoryFn<typeof Input.Password> = (props) => <Input.Password {...props}/>

export const Password = Template.bind({})
