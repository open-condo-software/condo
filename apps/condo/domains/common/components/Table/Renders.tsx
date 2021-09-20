import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { TextHighlighter } from '../TextHighlighter'
import { Typography } from 'antd'
import { colors } from '../../constants/style'
import { EmptyTableCell } from './EmptyTableCell'
import { get } from 'lodash'
import { LOCALES } from '../../constants/locale'
import dayjs from 'dayjs'
import { Highliter } from '../Highliter'
import { QueryArgType } from '../../utils/tables.utils'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'
const MONEY_PARTS_SEPARATOR = ' '

const getHighlightedText = (search: string, text: string) => {
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

export const getDateRender = (intl, search?: string) => {
    return function render (stringDate: string): RenderReturnType {
        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        return getHighlightedText(search, date.format('DD MMMM YYYY'))
    }
}

export const getAddressRender = (search?: QueryArgType, unitPrefix?: string) => {
    return function render (text: string): RenderReturnType {
        if (!isEmpty(search)) {
            return (
                <>
                    <Highliter
                        text={text}
                        search={String(search)}
                        renderPart={(part) => (
                            <Typography.Text style={{ backgroundColor: colors.markColor }}>
                                {part}
                            </Typography.Text>
                        )}
                    />
                    {` ${unitPrefix}`}
                </>
            )
        }
        return `${text} ${unitPrefix}`
    }
}

export const getTextRender = (search?: string) => {
    return function render (text: string): RenderReturnType {
        return getHighlightedText(search, text)
    }
}

const getIntegerPartOfreading = (value: string) => value.split('.')[0]

export const renderMeterReading = (values: string[], measure: string) => {
    // 1-tariff meter
    if (values[0] && !(values[1] || values[2] || values[3]))
        return `${getIntegerPartOfreading(values[0])} ${measure}`

    // multi-tariff meter
    const stringValues = values.reduce((acc, value, index) => {
        if (!value) return acc
        if (index !== 0) acc += ', '
        return acc += `T-${index + 1} - ${getIntegerPartOfreading(value)} ${measure}`
    }, '')

    console.log(stringValues)

    return stringValues
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
    if (separatorIndex === -1 || startIndex + text.length <= separatorIndex) {
        return (
            <Typography.Text style={extraStyles}>
                {fillMoneyWithSpaces(text, startIndex, spaces)}
            </Typography.Text>
        )
    }
    if (startIndex >= separatorIndex) {
        return (
            <Typography.Text type={'secondary'} style={extraStyles}>
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
            <Typography.Text type={'secondary'} style={extraStyles}>
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