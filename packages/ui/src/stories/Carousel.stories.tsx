import { get } from 'lodash'
import React from 'react'
import { styled } from 'storybook/theming'

import { Carousel as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

const AVAILABLE_COLORS = [
    colors.green['3'],
    colors.blue['3'],
    colors.red['3'],
    colors.teal['3'],
    colors.cyan['3'],
]

const Slide = styled.h1<{ index: number }>`
  background: ${(props) =>
        AVAILABLE_COLORS[props.index % AVAILABLE_COLORS.length]};
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
        },
        effect: {
            type: 'string',
            control: {
                type: 'select',
                options: ['scrollx', 'fade'],
            },
        },
        autoplay: {
            type: 'boolean',
        },
        autoplaySpeed: {
            type: 'number',
        },
        infinite: {
            type: 'boolean',
        },
        speed: {
            type: 'number',
        },
        draggable: {
            type: 'boolean',
        },
        slides: {
            type: 'number',
            control: {
                type: 'range',
                min: 1,
                max: 10,
            },
        },
        slidesToShow: {
            type: 'number',
            control: {
                type: 'range',
                min: 1,
                max: 4,
            },
        },
        controlsSize: {
            options: ['large', 'small'],
            control: {
                type: 'select',
            },
        },
    },
    args: {
        dots: true,
        effect: 'scrollx',
        autoplay: false,
        autoplaySpeed: 5000,
        infinite: true,
        speed: 500,
        draggable: false,
        slides: 5,
        slidesToShow: 1,
        controlsSize: 'large',
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = (args) => {
    const slidesAmount = get(args, 'slides')

    return (
        <Component {...args}>
            {[...Array(slidesAmount).keys()].map((key) => (
                <Slide key={key} index={key}>
                    {key + 1}
                </Slide>
            ))}
        </Component>
    )
}

export const Carousel: StoryObj<typeof Component> = {
    render: Template,
}
