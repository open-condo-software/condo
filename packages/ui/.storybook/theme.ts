import { create } from '@storybook/theming'
import { colors } from '../src/themes/default'

export default create({
    base: 'light',

    colorSecondary: colors.brandMain,

    appBg: colors.blacks.gray15,
    appBorderRadius: 12,
    appContentBg: colors.blacks.totalWhite,

    brandImage: 'https://condo.d.doma.ai/logoDoma.svg',
    brandTitle: 'Doma.ai',
    brandUrl: 'https://doma.ai'
})