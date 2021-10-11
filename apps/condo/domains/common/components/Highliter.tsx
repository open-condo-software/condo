import React from 'react'
import isEmpty from 'lodash/isEmpty'
const { ESCAPE_REGEX } = require('../constants/regexps')

export type HighliterRenderPart = (part: string, index?: number) => React.ReactElement

interface IHighliterProps {
    text: string
    search: string
    renderPart: HighliterRenderPart
}

export const Highliter: React.FC<IHighliterProps> = (props) => {
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