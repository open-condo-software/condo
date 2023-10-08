import { Convert } from './colors'
import rawColors from './colors.json'

import type { ColorPalette } from './colors'

const colors: ColorPalette = Convert.toColorPalette(JSON.stringify(rawColors))

export {
    colors,
}

export type { ColorPalette } from './colors'
