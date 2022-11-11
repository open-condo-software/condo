import React from 'react'
import get from 'lodash/get'
import { styled } from '@storybook/theming'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { colors } from '@open-condo/ui/src/colors'
import tokens from '@open-condo/ui/src/tokens/tokens.json'
import { identity } from 'lodash'

type SwatchColors = { [key: string]: string }
type SwatchColorsWithDescription = { [key: string]: { value: string, description?: string } }
type Swatch = {
    title: string,
    colors: SwatchColors
}
type SwatchWithDescription = Swatch & { colors: SwatchColorsWithDescription }

const extractSwatches = (colorSet: unknown, prefix: Array<string> = []): Array<Swatch> => {
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
        result.push(...extractSwatches(item.set, [...prefix, item.key]))
    }

    return result
}

const expandSwatch = (swatch: Swatch): SwatchWithDescription => {
    return {
        title: ['colors', swatch.title].filter(identity).join('.'),
        colors: Object.assign({}, ...Object.keys(swatch.colors).map(key => {
            const description = get(tokens, ['global', 'color', swatch.title, key, 'description'])
            const colorValue: SwatchColorsWithDescription = { [key]: { value: swatch.colors[key] } }
            if (description) {
                colorValue[key].description = description
            }

            return colorValue
        })),
    }
}

type ColorItemProps = {
    name: string
    value: string
    description?: string
}
const ColorItem: React.FC<ColorItemProps> = ({ name, value, description }) => {
    return (
        <div className='item'>
            <div className='color' style={{ background: value }}/>
            <span>
                <span className='name'>{name}&nbsp;</span>
                <span className='value'>{value}</span>
            </span>
            <span className='description'>{description}</span>
        </div>
    )
}
const StyledSwatch = styled.div`
  width: 100%;
  max-width: 100%;
  &:not(:first-child) {
    margin-top: 40px;
  }
  & > .title {
    margin-bottom: 20px;
    font-weight: 700;
  }
  & > .container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    column-gap: 24px;
    row-gap: 40px;
    @media(max-width: 700px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media(max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
    }
    & > .item {
      display: flex;
      flex-direction: column;
      & > .color {
        width: 100%;
        height: 80px;
        border-radius: 12px;
        box-shadow: 0 4px 14px #E6E8F1;
      }
      & > * {
        word-break: break-word;
      }
      & .name {
        //TODO(DOMA-4415): Replace with typography story / our component
        color: #222;
        font-weight: 600;
      }
      & *:not(.name) {
        //TODO(DOMA-4415): Replace with typography story / our component
        color: #707695;
      }
      & > *:not(:last-child) {
        margin-bottom: 12px;
      }
    }
  }
`
const ColorSwatch: React.FC<SwatchWithDescription> = ({ title, colors }) => {
    return (
        <StyledSwatch>
            {/*TODO(DOMA-4415): Replace with typography story / our component*/}
            <h2 className='title'>{title}</h2>
            <div className='container'>
                {Object.keys(colors).map((name, index) => (
                    <ColorItem
                        key={index}
                        name={name}
                        value={colors[name].value}
                        description={colors[name].description}
                    />
                ))}
            </div>
        </StyledSwatch>
    )
}

const ColorPalette: React.FC = () => {
    const swatches = extractSwatches(colors).map(expandSwatch)

    return (
        <>
            {swatches.map(swatch => (
                <ColorSwatch
                    title={swatch.title}
                    colors={swatch.colors}
                    key={swatch.title}
                />
            ))}
        </>
    )
}

export default {
    title: 'Colors',
    component: ColorPalette,
    parameters: {
        options: { showPanel: false },
        controls: { disabled: true },
    },
} as ComponentMeta<typeof ColorPalette>

const Template: ComponentStory<typeof ColorPalette> = (args) => <ColorPalette {...args}/>

export const Colors = Template.bind({})
