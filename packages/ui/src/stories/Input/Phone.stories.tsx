import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Input } from '@open-condo/ui/src'

export default {
    title: 'Components/Input',
    component: Input.Phone,
} as ComponentMeta<typeof Input.Phone>

const Template: ComponentStory<typeof Input.Phone> = (props) => <Input.Phone {...props}/>

export const Phone = Template.bind({})
