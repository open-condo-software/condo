const { create } = require('@storybook/theming')
const get = require('lodash/get')
const tokens = require('@condo/ui/src/tokens/tokens.json')
const colors = require('@condo/ui/src/colors/colors.json')

module.exports = create({
    base: 'light',

    colorSecondary: colors.dom.brand.main,

    appBorderRadius: parseInt(get(tokens, ['global', 'borderRadius', 'large', 'value'], '12')),
    appBg: colors.dom.blackAndWhite.gray15,

    textColor: colors.dom.blackAndWhite.black,

    brandTitle: 'Condo UI',
    brandImage: '/logo.svg'
})