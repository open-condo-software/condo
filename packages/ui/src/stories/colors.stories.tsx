import { identity } from 'lodash'
import get from 'lodash/get'
import React from 'react'
import { styled } from 'storybook/theming'

import { Space, Typography, Card } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'
import tokens from '@open-condo/ui/src/tokens/tokens.json'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

type SwatchColors = { [key: string]: string }
type SwatchColorsWithDescription = {
    [key: string]: { value: string, description?: string }
}
type Swatch = {
    title: string
    colors: SwatchColors
}
type SwatchWithDescription = Swatch & { colors: SwatchColorsWithDescription }

const extractSwatches = (
    colorSet: unknown,
    prefix: Array<string> = [],
): Array<Swatch> => {
    const result: Array<Swatch> = []
    const colors: SwatchColors = {}
    const queue: Array<{ key: string, set: unknown }> = []

    if (typeof colorSet === 'object' && colorSet !== null) {
        for (const key of Object.keys(colorSet)) {
            const subSet = get(colorSet, key)
            if (typeof subSet === 'object' && subSet !== null) {
                queue.push({ key, set: subSet })
            } else if (typeof subSet === 'string' && subSet) colors[key] = subSet
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
        colors: Object.assign(
            {},
            ...Object.keys(swatch.colors).map((key) => {
                const description = get(tokens, [
                    'global',
                    'color',
                    swatch.title,
                    key,
                    'description',
                ])
                const colorValue: SwatchColorsWithDescription = {
                    [key]: { value: swatch.colors[key] },
                }
                if (description) {
                    colorValue[key].description = description
                }

                return colorValue
            }),
        ),
    }
}

type ColorItemProps = {
    name: string
    value: string
    description?: string
}

const ColorBox = styled.div`
  width: 100%;
  height: 100px;
`

const ColorItem: React.FC<ColorItemProps> = ({ name, value, description }) => {
    return (
        <Card
            title={<ColorBox style={{ background: value }} />}
            titlePadding={0}
            bodyPadding={12}
        >
            <Space direction='vertical' size={12}>
                <Typography.Paragraph>
                    <Typography.Text strong>{name}&nbsp;</Typography.Text>
                    <Typography.Text type='secondary'>{value}</Typography.Text>
                </Typography.Paragraph>
                {Boolean(description) && (
                    <Typography.Paragraph type='secondary' size='medium'>
                        {description}
                    </Typography.Paragraph>
                )}
            </Space>
        </Card>
    )
}

const StyledSwatch = styled.div`
  width: 100%;
  max-width: 100%;
  &:not(:first-child) {
    margin-top: 40px;
  }
  & > *:first-child {
    margin-bottom: 20px;
  }
  & > .container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    column-gap: 24px;
    row-gap: 40px;
    @media (max-width: 700px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`
const ColorSwatch: React.FC<SwatchWithDescription> = ({ title, colors }) => {
    return (
        <StyledSwatch>
            <Typography.Title level={2}>{title}</Typography.Title>
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
            {swatches.map((swatch) => (
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
} as Meta<typeof ColorPalette>

export const Colors: StoryObj<typeof ColorPalette> = {}
