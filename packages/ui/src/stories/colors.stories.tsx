import React from 'react'
import get from 'lodash/get'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { ColorItem, ColorPalette as SBColorPalette } from '@storybook/addon-docs'
import { colors } from '@condo/ui/colors'

type SwatchColors = { [key: string]: string }
type Swatch = {
    title: string,
    colors: SwatchColors
}
type ColorPaletteProps = {
    namespace: string,
}

const colorStyleGuides = {
    'colors.dom.brand': 'Colors used to highlight the main elements of the interface',
    'colors.dom.blackAndWhite': 'Palette of black and white shades used to create most of the elements',
    'colors.dom.events': 'Colors used as a system reaction to certain events',
    'colors.dom.ticketStatus': 'Colors used to accent visual elements associated with the ticket, based on its status',
    'colors.dom.ticketType': 'Colors used to accent visual elements associated with the ticket, based on its type',
}

const extractColors = (colorSet: unknown, prefix: Array<string>): Array<Swatch> => {
    const result: Array<Swatch> = []
    const colors: SwatchColors = {}
    const queue: Array<{ key: string, set: unknown }> = []

    if (typeof colorSet === 'object' && colorSet !== null) {
        for (const key of Object.keys(colorSet)) {
            const subSet = get(colorSet, key)
            if (typeof subSet === 'object' && subSet !== null) {
                queue.push({ key, set: subSet })
            } else if (typeof subSet === 'string' && subSet) (
                colors[key] = subSet
            )
        }
    }

    if (Object.keys(colors).length) {
        result.push({ title: prefix.join('.'), colors })
    }

    for (const item of queue) {
        result.push(...extractColors(item.set, [...prefix, item.key]))
    }

    return result
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ namespace }) => {
    const palette = get(colors, namespace, {})
    const extractedSets = extractColors(palette, ['colors', namespace])



    return (
        <SBColorPalette>
            {
                extractedSets.map((colorSet) => (
                    <ColorItem
                        key={colorSet.title}
                        title={colorSet.title}
                        subtitle={get(colorStyleGuides, [colorSet.title], '')}
                        colors={colorSet.colors}
                    />
                ))
            }
        </SBColorPalette>
    )
}

export default {
    title: 'Colors',
    component: ColorPalette,
    parameters: {
        options: { showPanel: false },
    },
} as ComponentMeta<typeof ColorPalette>

const Template: ComponentStory<typeof ColorPalette> = (args) => <ColorPalette {...args}/>

export const DOM = Template.bind({}, { namespace: 'dom' })
