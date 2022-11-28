import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Banner as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Banner',
    component: Component,
    args: {
        backgroundColor: '#9FA0F2',
        actionText: 'Detail',
        title: 'Settlement bank',
        subtitle: 'Accept payments from residents in the Doma mobile app',
        imgUrl: 'https://i.imgur.com/jpjTXWM.png',
        invertText: false,
    },
    argTypes: {
        onClick: { control: false },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => <Component {...args}/>

export const Banner = Template.bind({})