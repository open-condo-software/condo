import { Tag as DefaultTag, Typography } from 'antd'
import get from 'lodash/get'
import React from 'react'

import { colors } from '@condo/domains/common/constants/style'

export type TagType = 'red' | 'orange' | 'green' | 'gray'

type TagTheme = {
    textColor: string
    backgroundColor: string
}

interface ITagProps {
    type: TagType
    style?: React.CSSProperties
}

const TAG_THEMES: { [key in TagType]: TagTheme } = {
    red: {
        textColor: colors.red[5],
        backgroundColor: colors.red[2],
    },
    orange: {
        textColor: colors.orange[7],
        backgroundColor: colors.orange[3],
    },
    green: {
        textColor: colors.green[7],
        backgroundColor: colors.green[2],
    },
    gray: {
        textColor: colors.textSecondary,
        backgroundColor: colors.backgroundLightGrey,
    },
}

export const Tag: React.FC<ITagProps> = ({ children, type, style }) => {
    const theme = get(TAG_THEMES, type)
    const textColor = get(theme, 'textColor', undefined)
    const backgroundColor = get(theme, 'backgroundColor', undefined)
    return (
        <DefaultTag color={backgroundColor} style={style ? style : {}}>
            <Typography.Text style={textColor ? { color: textColor } : {}}>
                {children}
            </Typography.Text>
        </DefaultTag>
    )
}