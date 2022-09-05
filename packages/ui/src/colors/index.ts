import rawColors from './colors.json'
import { Convert, ColorPalette } from './colors'

const colors = Convert.toColorPalette(JSON.stringify(rawColors))

export {
    colors,
    ColorPalette,
}

