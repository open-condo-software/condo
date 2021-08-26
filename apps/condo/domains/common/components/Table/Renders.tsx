import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { TextHighlighter } from '../TextHighlighter'
import { Typography } from 'antd'
import { colors } from '../../constants/style'
import { EmptyTableCell } from './EmptyTableCell'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'
const MONEY_PARTS_SEPARATOR = ' '

export const getTextRender = (search: string) => {
    return function render (text: string): RenderReturnType {
        let result: RenderReturnType = text
        if (!isEmpty(search) && text) {
            result = (
                <TextHighlighter
                    text={String(text)}
                    search={search}
                    renderPart={(part, startIndex, marked) => (
                        <Typography.Text style={marked ? { backgroundColor: colors.markColor } : {}}>
                            {part}
                        </Typography.Text>
                    )}
                />
            )
        }
        return (<EmptyTableCell>{result}</EmptyTableCell>)
    }
}

const fillMoneyWithSpaces = (substring: string, startIndex: number, spaces: Array<number>) => {
    const chars = []
    for (let i = 0; i < substring.length; i++) {
        const absoluteIndex = startIndex + i
        const char = substring.charAt(i)
        if (spaces.includes(absoluteIndex)) {
            chars.push(MONEY_PARTS_SEPARATOR)
        }
        chars.push(char)
    }
    return chars.join('')
}

const recolorMoney = (
    text: string, startIndex: number, separatorIndex: number, spaces: Array<number>, extraStyles: React.CSSProperties
) => {
    if (separatorIndex === - 1 || startIndex + text.length <= separatorIndex) {
        return (
            <Typography.Text style={extraStyles}>
                {fillMoneyWithSpaces(text, startIndex, spaces)}
            </Typography.Text>
        )
    }
    if (startIndex >= separatorIndex) {
        return (
            <Typography.Text style={{ color: colors.sberGrey[3], ...extraStyles }}>
                {fillMoneyWithSpaces(text, startIndex, spaces)}
            </Typography.Text>
        )
    }
    const blackLength = separatorIndex - startIndex
    return (
        <>
            <Typography.Text style={extraStyles}>
                {fillMoneyWithSpaces(text.substring(0, blackLength), startIndex, spaces)}
            </Typography.Text>
            <Typography.Text style={{ color: colors.sberGrey[3], ...extraStyles }}>
                {text.substring(blackLength)}
            </Typography.Text>
        </>
    )
}

export const getMoneyRender = (search: string, currencyMark = '₽', partSeparator = DEFAULT_CURRENCY_SEPARATOR) => {
    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>
        text = text.replace('.', partSeparator)
        const separatorIndex = text.indexOf(partSeparator)
        const lastSymbol = text.startsWith('-') ? 2 : 1
        const spaces = []
        for (let i = separatorIndex - 3; i >= lastSymbol; i -= 3) {
            spaces.push(i)
        }
        const markStyles = { backgroundColor: colors.markColor }
        if (isEmpty(search)) {
            return (
                <>
                    {recolorMoney(text, 0, separatorIndex, spaces, {})}
                    &nbsp;
                    {currencyMark}
                </>
            )
        }
        return (
            <>
                <TextHighlighter
                    text={text}
                    search={search}
                    renderPart={(part, startIndex, marked) =>
                        recolorMoney(part, startIndex, separatorIndex, spaces, marked ? markStyles : {})}
                />
                &nbsp;
                {currencyMark}
            </>
        )
    }
}