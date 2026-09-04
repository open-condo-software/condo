import get from 'lodash/get'
import { create } from 'storybook/theming'

import colors from '@open-condo/ui/src/colors/colors.json'
import tokens from '@open-condo/ui/src/tokens/tokens.json'

export default create({
    base: 'light',

    colorSecondary: colors.green['5'],

    appBorderRadius: parseInt(get(tokens, ['global', 'borderRadius', 'large', 'value'], '12')),
    appBg: colors.gray['1'],

    textColor: colors.black,

    brandTitle: 'Condo UI',
    brandImage: '/ui/logo.svg',
})