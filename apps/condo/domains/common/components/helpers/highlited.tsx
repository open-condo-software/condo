import React from 'react'
import { FilterValue } from 'antd/es/table/interface'
import { Typography } from 'antd'
import isEmpty from 'lodash/isEmpty'

import { TextHighlighter, TTextHighlighterRenderPartFN } from '../TextHighlighter'
import { colors } from '../../constants/style'

type TGetHighlitedFN = (search?: FilterValue, postfix?: string) => (text?: string) => React.ReactElement | string

const HIGHLITER_STYLES = { backgroundColor: colors.markColor }

const highlighterRenderPart: TTextHighlighterRenderPartFN = (part) => (
    <Typography.Text style={HIGHLITER_STYLES}>{part}</Typography.Text>
)

export const getHighlited: TGetHighlitedFN = (search, postfix) => (text = '') => {
    if (isEmpty(search) && !text) return postfix ? `${text} ${postfix}` : text

    return (
        <>
            <TextHighlighter
                text={String(text)}
                search={String(search)}
                renderPart={highlighterRenderPart}
            />
            {postfix && ` ${postfix}`}
        </>
    )
}
