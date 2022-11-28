import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Banner as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

export default {
    title: 'Components/Banner',
    component: Component,
    args: {
        // backgroundColor: 'linear-gradient(90deg, #85EBA4 0%, #9FD5FF 100%)',
        backgroundColor: colors.brandGradient['5'],
        actionText: 'Detail',
        title: '123456789012345678901234567 123456789012345678901234567',
        // title: 'Settlement bank',
        // subtitle: 'Accept payments from residents in the Doma mobile app',
        subtitle: '1234567890123456789012345678901234567890 1234567890123456789012345678901234567890',
        imgUrl: 'https://i.imgur.com/TuHXW0r.jpeg',
        // imgUrl: 'https://i.imgur.com/jpjTXWM.png',
        invertText: false,
    },
    argTypes: {
        onClick: { control: false },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => <Component {...args}/>

export const Banner = Template.bind({})