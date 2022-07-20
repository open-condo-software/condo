import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { Typography } from 'antd'
import { BaseType } from 'antd/lib/typography/Base'

import { getEscaped } from '@condo/domains/common/utils/string.utils'
import { isNull } from 'lodash'

export type TTextHighlighterRenderPartFN = (
    part: string,
    startIndex: number,
    marked: boolean,
    type?: BaseType,
    style?: React.CSSProperties,
) => React.ReactElement

export type TTextHighlighterProps = {
    text: string
    search: string
    renderPart: TTextHighlighterRenderPartFN
    type?: BaseType
    style?: React.CSSProperties,
    title?: string
}

export const TextHighlighter: React.FC<TTextHighlighterProps> = (props) => {
    const { text, search, renderPart, type, style, title: titleFromProps, children } = props
    const title = titleFromProps || isNull(titleFromProps) ? titleFromProps : text

    if (isEmpty(text)) return null

    let result
    const searchRegexp = new RegExp(`(${getEscaped(search)})`, 'ig')

    if (isEmpty(search) || !searchRegexp.test(text)) {
        result = renderPart(text, 0, false, type, style)
    } else {
        let symbolsPassed = 0
        const parts = text.split(searchRegexp)
        result = parts.map((part) => {
            const startSymbolIndex = symbolsPassed
            const isMatch = searchRegexp.test(part)

            symbolsPassed += part.length

            return renderPart(part, startSymbolIndex, isMatch, type)
        })
    }

    return <Typography.Text title={title} type={type} style={style}>{result} {children}</Typography.Text>
}