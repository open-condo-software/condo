import React from 'react'
import isEmpty from 'lodash/isEmpty'

const { ESCAPE_REGEX } = require('../constants/regexps')

export type TTextHighlighterRenderPartFN = (part: string, startIndex: number, marked: boolean) => React.ReactElement

interface ITextHighlighterProps {
    text: string
    search: string
    renderPart: TTextHighlighterRenderPartFN
}

export const TextHighlighter: React.FC<ITextHighlighterProps> = ({ text, search, renderPart }) => {
    if (!text) return null

    if (isEmpty(search)) {
        return <>{ renderPart(text, 0, false) }</>
    }

    const searchRegexp = new RegExp(`(${ESCAPE_REGEX(search)})`, 'ig')

    if (!text.match(searchRegexp)) {
        return <>{ renderPart(text, 0, false) }</>
    }

    const parts = text.split(searchRegexp)

    let symbolsPassed = 0
    const elements = parts.map((part) => {
        const startSymbolIndex = symbolsPassed

        symbolsPassed += part.length

        if (part.match(searchRegexp)) {
            return renderPart(part, startSymbolIndex, true)
        }

        return renderPart(part, startSymbolIndex, false)
    })

    return <>{elements}</>
}