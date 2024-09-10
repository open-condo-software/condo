import { StoryFn, Meta } from '@storybook/react'
import React from 'react'

import { Input } from '@open-condo/ui/src'

export default {
    title: 'Components/Input',
    component: Input.Phone,
    args: {
        disabled: false,
    },
} as Meta<typeof Input.Phone>

const Template: StoryFn<typeof Input.Phone> = (props) => <Input.Phone {...props}/>

export const Phone = Template.bind({})
