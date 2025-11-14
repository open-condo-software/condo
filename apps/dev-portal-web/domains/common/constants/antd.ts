import { colors } from '@open-condo/ui/colors'

import type { ThemeConfig } from 'antd/lib/config-provider'

export const theme: ThemeConfig = {
    token: {
        colorPrimary: colors.green['5'],
        colorPrimaryBg: colors.green['1'],
        colorPrimaryBgHover: colors.green['1'],
        colorBgContainer: colors.white,
        colorFillTertiary: colors.gray['1'],
        colorError: colors.red['5'],
        fontFamily: 'var(--condo-global-font-family-default)',
    },
    components: {
        Menu: {
            colorPrimaryBg: colors.gray['1'],
            subMenuItemBg: colors.white,
            itemHoverBg: colors.gray['1'],
            itemSelectedBg: colors.gray['1'],
            itemSelectedColor: colors.gray['7'], // Override icon color, use Typography for
            itemHoverColor: colors.gray['7'],
            activeBarBorderWidth: 0,
        },
        Divider: {
            margin: 0,
            colorSplit: colors.gray['3'],
        },
        Table: {
            colorBorderSecondary: colors.gray['3'],
            colorFillAlter: colors.white,
            colorTextHeading: colors.gray['7'],
            fontFamily: 'var(--condo-global-font-family-default)',
            padding: 16,
            borderRadiusLG: 12,
        },
        Pagination: {
            colorBgTextHover: colors.gray['1'],
            colorTextDisabled: colors.gray['5'],
        },
        Collapse: {
            headerBg: colors.white,
        },
        Notification: {
            colorInfoBg: colors.white,
            colorSuccessBg: colors.white,
            colorWarningBg: colors.white,
            colorErrorBg: colors.white,
        },
    },
}