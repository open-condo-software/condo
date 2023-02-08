import { colors } from '@open-condo/ui/colors'

import type { ThemeConfig } from 'antd/lib/config-provider'

export const theme: ThemeConfig = {
    token: {
        colorPrimary: colors.green['5'],
        colorBgContainer: colors.white,
    },
    components: {
        Menu: {
            colorPrimaryBg: colors.gray['1'],
            colorSubItemBg: colors.white,
            colorItemBgHover: colors.gray['1'],
            colorItemBgSelected: colors.gray['1'],
            colorItemTextSelected: colors.gray['7'], // Override icon color, use Typography for
            colorItemTextHover: colors.gray['7'],
            colorActiveBarBorderSize: 0,
        },
    },
}