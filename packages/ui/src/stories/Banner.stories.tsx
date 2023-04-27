import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Banner as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

export default {
    title: 'Components/Banner',
    component: Component,
    argTypes: {
        backgroundColor: {
            control: 'text',
        },
        onClick: { control: false },
        size: {
            control: {
                type: 'select',
                options: [undefined, 'compact'],
            },
        },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => <Component {...args}/>

export const Solid = Template.bind({})
Solid.args = {
    backgroundColor: '#9b9dfa',
    title: 'Settlement bank',
    subtitle: 'Accept payments from residents in the Doma mobile app',
    imgUrl: 'https://i.imgur.com/OAG817v.png',
    invertText: true,
    actionText: 'More',
}

export const Gradient = Template.bind({})
Gradient.args = {
    backgroundColor: colors.brandGradient['1'],
    title: 'Some long description that takes 2 rows of texts',
    subtitle: 'Text can also takes up to 2 rows, containing 40 symbols each, so use it wisely',
    imgUrl: 'https://i.imgur.com/1iOC5BE.png',
    invertText: false,
    actionText: 'Click me button',
}

export const NoAction = Template.bind({})
NoAction.args = {
    backgroundColor: '#d3e3ff',
    title: 'Banner can exist without an action button',
    subtitle: 'Text can also takes up to 2 rows, containing 40 symbols each, so use it wisely',
    imgUrl: 'https://i.imgur.com/ambPuQF.png',
    invertText: false,
}

export const Compact = Template.bind({})
Compact.args = {
    backgroundColor: '#d3e3ff',
    title: 'Banner can exist without an action button',
    subtitle: 'Text can also takes up to 2 rows, containing 40 symbols each, so use it wisely',
    imgUrl: 'https://i.imgur.com/ambPuQF.png',
    invertText: false,
    actionText: 'Click me link',
    size: 'small',
}