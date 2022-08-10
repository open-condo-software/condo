import { create } from '@storybook/theming'
import { colors } from '../src/themes/default'

export default create({
    base: 'light',

    colorSecondary: colors.brand.main,

    appBg: colors.gray.gray15,
    appBorderRadius: 12,
    appContentBg: colors.gray.totalWhite,

    brandImage: 'https://condo.d.doma.ai/logoDoma.svg',
    brandTitle: 'Doma.ai',
    brandUrl: 'https://doma.ai'
})