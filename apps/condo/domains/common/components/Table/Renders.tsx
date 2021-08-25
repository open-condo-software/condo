import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { TextHighlighter } from '../TextHighlighter'
import { Typography } from 'antd'
import { colors } from '../../constants/style'
import { EmptyTableCell } from './EmptyTableCell'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'

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

const recolorMoney = (text: string, startIndex: number, separatorIndex: number, extraStyles: React.CSSProperties) => {
    if (separatorIndex === - 1 || startIndex + text.length <= separatorIndex) {
        return (
            <Typography.Text style={extraStyles}>
                {text}
            </Typography.Text>
        )
    }
    if (startIndex >= separatorIndex) {
        return (
            <Typography.Text style={{ color: colors.sberGrey[3], ...extraStyles }}>
                {text}
            </Typography.Text>
        )
    }
    const blackLength = separatorIndex - startIndex
    return (
        <>
            <Typography.Text style={extraStyles}>
                {text.substring(0, blackLength)}
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
        const separatorIndex = text.indexOf(partSeparator)
        const markStyles = { backgroundColor: colors.markColor }
        if (isEmpty(search)) {
            return (
                <>
                    {recolorMoney(text, 0, separatorIndex, {})}
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
                        recolorMoney(part, startIndex, separatorIndex, marked ? markStyles : {})}
                />
                &nbsp;
                {currencyMark}
            </>
        )
    }
}