import React from 'react'
import isEmpty from 'lodash/isEmpty'

const { ESCAPE_REGEX } = require('../constants/regexps')

export type THighlighterRenderPartFN = (part: string, index?: number) => React.ReactElement

interface IHighlighterProps {
    text: string
    search: string
    renderPart: THighlighterRenderPartFN
}

/**
 * DEPRECATED! Please use apps/condo/domains/common/components/TextHighlighter.tsx
 * @param props
 * @constructor
 */
export const Highlighter: React.FC<IHighlighterProps> = (props) => {
    const { text, search, renderPart } = props

    if (!text) return null

    if (isEmpty(search)) {
        return <>{ text }</>
    }

    const searchRegexp = new RegExp(`(${ESCAPE_REGEX(search)})`, 'ig')

    if (!text.match(searchRegexp)) {
        return <>{ text }</>
    }

    const parts = text.split(searchRegexp)

    const highlited = parts.map((part, index) => {
        // Todo(zuch): mark - is standart search result highlighter - but can not override it's color - it is $gold[5] in antd sources
        return part.match(searchRegexp) ? renderPart(part, index) : part
    })

    return (
        <>{ highlited }</>
    )
}