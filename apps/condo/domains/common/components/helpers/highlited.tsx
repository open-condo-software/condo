import React from 'react'
import { FilterValue } from 'antd/es/table/interface'
import { Typography } from 'antd'
import isEmpty from 'lodash/isEmpty'

import { Highliter, HighliterRenderPart } from '../Highliter'
import { colors } from '../../constants/style'

type GetHighlited = (search?: FilterValue, postfix?: string) => (text?: string) => React.ReactElement | string

const HIGHLITER_STYLES = { backgroundColor: colors.markColor }

const highlighterRenderPart: HighliterRenderPart = (part) => (
    <Typography.Text style={HIGHLITER_STYLES}>{part}</Typography.Text>
)

export const getHighlited: GetHighlited = (search, postfix) => (text) => {
    if (!isEmpty(search) && text) {
        return (
            <>
                <Highliter
                    text={String(text)}
                    search={String(search)}
                    renderPart={highlighterRenderPart}
                />
                {postfix && ` ${postfix}`}
            </>
        )
    }

    return postfix ? `${text} ${postfix}` : text
}
