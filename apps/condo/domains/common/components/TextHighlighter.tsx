import { isEmpty } from 'lodash'
import React from 'react'
const { ESCAPE_REGEX } = require('../constants/regexps')

interface ITextHighlighterProps {
    text: string
    search: string
    renderPart: (part: string, startIndex: number, marked: boolean) => React.ReactElement
}

export const TextHighlighter: React.FC<ITextHighlighterProps> = ({ text, search, renderPart }) => {
    if (!text) return null

    if (isEmpty(search)) {
        return <>{ text }</>
    }

    const searchRegexp = new RegExp(`(${ESCAPE_REGEX(search)})`, 'ig')
    if (!text.match(searchRegexp)) {
        return <>{ text }</>
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