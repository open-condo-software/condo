import isEmpty from 'lodash/isEmpty'
import React from 'react'

import { getEscaped } from '@condo/domains/common/utils/string.utils'

export type THighlighterRenderPartFN = (part: string, index?: number) => React.ReactElement

interface IHighlighterProps {
    text: string
    search: string
    renderPart: THighlighterRenderPartFN
}

/**
 * DEPRECATED! Please use apps/condo/domains/common/components/TextHighlighter.tsx
 * @deprecated since 2021-10-21
 * @param props
 * @constructor
 */
export const Highlighter: React.FC<IHighlighterProps> = (props) => {
    const { text, search, renderPart } = props

    if (!text) return null

    if (isEmpty(search)) return <>{ text }</>

    const searchRegexp = new RegExp(`(${getEscaped(search)})`, 'ig')

    if (!searchRegexp.test(text)) return <>{ text }</>

    const parts = text.split(searchRegexp)

    const highlited = parts.map((part, index) => {
        // Todo(zuch): mark - is standart search result highlighter - but can not override it's color - it is $gold[5] in antd sources
        return searchRegexp.test(part) ? renderPart(part, index) : part
    })

    return <>{ highlited }</>
}