import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { Typography } from 'antd'

import { getEscaped } from '@condo/domains/common/utils/string.utils'

export type TTextHighlighterRenderPartFN = (part: string, startIndex: number, marked: boolean) => React.ReactElement

interface ITextHighlighterProps {
    text: string
    search: string
    renderPart: TTextHighlighterRenderPartFN
}

export const TextHighlighter: React.FC<ITextHighlighterProps> = ({ text, search, renderPart }) => {
    if (!text) return null

    let result
    const searchRegexp = new RegExp(`(${getEscaped(search)})`, 'ig')

    if (isEmpty(search) || !searchRegexp.test(text)) {
        result = renderPart(text, 0, false)
    } else {
        let symbolsPassed = 0
        const parts = text.split(searchRegexp)

        result = parts.map((part) => {
            const startSymbolIndex = symbolsPassed
            const isMatch = searchRegexp.test(part)

            symbolsPassed += part.length

            return renderPart(part, startSymbolIndex, isMatch)
        })
    }

    return <Typography.Text title={text}>{result}</Typography.Text>
}