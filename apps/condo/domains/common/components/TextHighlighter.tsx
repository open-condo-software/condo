import { Typography } from 'antd'
import { BaseType } from 'antd/lib/typography/Base'
import { isNull } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import React from 'react'

import { getEscaped } from '@condo/domains/common/utils/string.utils'

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
    style?: React.CSSProperties
    title?: string
}

export const TextHighlighter: React.FC<React.PropsWithChildren<TTextHighlighterProps>> = (props) => {
    const { text, search, renderPart, type, style, title: titleFromProps, children } = props
    const title = titleFromProps || isNull(titleFromProps) ? titleFromProps : text

    if (isEmpty(text)) return null

    let result
    // not a ReDoS issue: running on end user browser
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const searchRegexp = new RegExp(`(${getEscaped(search)})`, 'ig') // NOSONAR

    if (isEmpty(search) || !searchRegexp.test(text)) {
        result = renderPart(text, 0, false, type, style)
    } else {
        let symbolsPassed = 0
        const parts = text.split(searchRegexp)
        result = parts.map((part, index) => {
            const startSymbolIndex = symbolsPassed
            const isMatch = searchRegexp.test(part)

            symbolsPassed += part.length

            return <React.Fragment key={index}>{renderPart(part, startSymbolIndex, isMatch, type)}</React.Fragment>
        })
    }

    return <Typography.Text title={title} type={type} style={style}>{result} {children}</Typography.Text>
}