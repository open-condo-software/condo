import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Tag as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

export default {
    title: 'Components/Tag',
    component: Component,
    args: {
        children: 'Label',
        textColor: colors.gray['7'],
        bgColor: colors.gray['1'],
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => <Component {...args}/>

export const Tag = Template.bind({})