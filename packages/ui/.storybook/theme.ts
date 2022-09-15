import { create } from '@storybook/theming'
import get from 'lodash/get'
import tokens from '@condo/ui/src/tokens/tokens.json'
import colors from '@condo/ui/src/colors/colors.json'

export default create({
    base: 'light',

    colorSecondary: colors.dom.brand.main,

    appBorderRadius: parseInt(get(tokens, ['global', 'borderRadius', 'large', 'value'], '12')),
    appBg: colors.dom.blackAndWhite.gray15,

    textColor: colors.dom.blackAndWhite.black,

    brandTitle: 'Condo UI',
    brandImage: '/logo.svg'
})