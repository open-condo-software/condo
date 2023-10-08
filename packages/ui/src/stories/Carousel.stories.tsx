import { ComponentStory, ComponentMeta } from '@storybook/react'
import { styled } from '@storybook/theming'
import { get } from 'lodash'
import React from 'react'

import { Carousel as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

const AVAILABLE_COLORS = [
    colors.green['3'],
    colors.blue['3'],
    colors.red['3'],
    colors.teal['3'],
    colors.cyan['3'],
]

const Slide = styled.h1<{ index: number }>`
  background: ${(props => AVAILABLE_COLORS[props.index % AVAILABLE_COLORS.length])};
  border-radius: 8px;
  height: 320px;
  line-height: 320px;
  text-align: center;
  margin: 0;
`

export default {
    title: 'Components/Carousel',
    component: Component,
    argTypes: {
        dots: {
            type: 'boolean',
            defaultValue: true,
        },
        effect: {
            type: 'string',
            defaultValue: 'scrollx',
            control: {
                type: 'select',
                options: ['scrollx', 'fade'],
            },
        },
        autoplay: {
            type: 'boolean',
            defaultValue: false,
        },
        autoplaySpeed: {
            type: 'number',
            defaultValue: 5000,
        },
        infinite: {
            type: 'boolean',
            defaultValue: true,
        },
        speed: {
            type: 'number',
            defaultValue: 500,
        },
        draggable: {
            type: 'boolean',
            defaultValue: false,
        },
        slides: {
            type: 'number',
            defaultValue: 5,
            control: {
                type: 'range',
                min: 1,
                max: 10,
            },
        },
        slidesToShow: {
            type: 'number',
            defaultValue: 1,
            control: {
                type: 'range',
                min: 1,
                max: 4,
            },
        },
        controlsSize: {
            defaultValue: 'large',
            options: ['large', 'small'],
            control: {
                type: 'select',
            },
        },
    },
} as ComponentMeta<typeof Component>


const Template: ComponentStory<typeof Component> = (args) => {
    const slidesAmount = get(args, 'slides')

    return (
        <Component {...args}>
            {[...Array(slidesAmount).keys()].map(key => (
                <Slide key={key} index={key}>{key + 1}</Slide>
            ))}
        </Component>
    )
}

export const Carousel = Template.bind({})