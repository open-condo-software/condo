import rawColors from './colors.json'
import { Convert } from './colors'
import type { ColorPalette } from './colors'

const colors = Convert.toColorPalette(JSON.stringify(rawColors))

export {
    colors,
    ColorPalette,
}

