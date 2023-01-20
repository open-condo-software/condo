import { isEmpty } from 'lodash'
import React from 'react'

const { ESCAPE_REGEX } = require('../constants/regexps')

interface IHighliterProps {
    text: string
    search: string
    renderPart: (part: string, index: number) => React.ReactElement
}

/**
 * @deprecated
 * Please use TextHighlighter instead
 */
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
        if (part.match(searchRegexp)){
            // Todo(zuch): mark - is standart search result highlighter - but can not override it's color - it is $gold[5] in antd sources
            return renderPart(part, index)
        }

        return part
    })

    return (
        <>{ highlited }</>
    )
}