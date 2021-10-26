import React from 'react'
import { Typography } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { FilterValue } from 'antd/es/table/interface'

import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'

import { LOCALES } from '../../constants/locale'
import { QueryArgType } from '../../utils/tables.utils'
import { TextHighlighter } from '../TextHighlighter'
import { ELLIPSIS_ROWS } from '../../constants/style'
import { colors } from '../../constants/style'

import { EmptyTableCell } from './EmptyTableCell'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'
const DEFAULT_CURRENCY_CODE = 'RUB'
const MARKED_TEXT_STYLES = { backgroundColor: colors.markColor }
const EMPTY_TEXT_STYLES = {}
const ELLIPSIS_SETTINGS = { rows: ELLIPSIS_ROWS, expandable: false }
const ELLIPSIS_STYLES = { marginBottom: 0 }

type TGetHighlitedFN = (search?: FilterValue, postfix?: string) => (text?: string) => React.ReactElement | string

/**
 * Returned function renders provided text with highlited parts according to search value
 * @param search
 * @param postfix
 */
export const getHighlitedContents: TGetHighlitedFN = (search, postfix) => (text) => {
    // Sometimes we can receive null/undefined as text
    const renderText = text ? String(text) : ''

    if (isEmpty(search) && !renderText) return postfix ? `${renderText} ${postfix}` : renderText

    return (
        <>
            <TextHighlighter
                text={renderText}
                search={String(search)}
                renderPart={renderHighlightedPart}
            />
            {postfix && ` ${postfix}`}
        </>
    )
}


type TGetRendererFN =  (search?: FilterValue, ellipsis?: boolean, postfix?: string) => (text?: string) => React.ReactElement

/**
 * Returned function renders provided text as a cell with highlighted search and multi row ellipsis
 * @param search
 * @param ellipsis
 * @param postfix
 * @return cell contents renderer fn
 */
export const getTableCellRenderer: TGetRendererFN = (search, ellipsis = false, postfix = '') =>
    (text) => {
        const highlitedContent = getHighlitedContents(search, postfix)(text)

        return (
            <EmptyTableCell>
                {ellipsis
                    ? (
                        <Typography.Paragraph ellipsis={ELLIPSIS_SETTINGS} title={`${text} ${postfix || ''}`} style={ELLIPSIS_STYLES}>
                            {highlitedContent}
                        </Typography.Paragraph>
                    )
                    : <>{highlitedContent}</>
                }
            </EmptyTableCell>
        )
    }

/**
 * Marks text according to marked flag
 * @param part
 * @param startIndex
 * @param marked
 */
export const renderHighlightedPart = (part, startIndex, marked) => (
    <Typography.Text style={marked ? MARKED_TEXT_STYLES : EMPTY_TEXT_STYLES}>
        {part}
    </Typography.Text>
)

const renderHighlightedCellContents = (search: string, text: string) => {
    let result: RenderReturnType = text

    if (!isEmpty(search) && text) {
        result = (
            <TextHighlighter
                text={String(text)}
                search={String(search)}
                renderPart={renderHighlightedPart}
            />
        )
    }

    return <EmptyTableCell>{result}</EmptyTableCell>
}

const DATE_FORMAT_LONG = 'DD MMM YYYY'
const DATE_FORMAT_SHORT = 'DD MMM'

export const getDateRender = (intl, search?: string, short?: boolean) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)

        return renderHighlightedCellContents(search, date.format(short ? DATE_FORMAT_SHORT : DATE_FORMAT_LONG))
    }
}

export const getAddressRender = (search?: QueryArgType, unitPrefix?: string) => {
    return function render (text: string): RenderReturnType {
        if (isEmpty(search)) return `${text} ${unitPrefix}`

        return (
            <>
                <TextHighlighter
                    text={text}
                    search={String(search)}
                    renderPart={renderHighlightedPart}
                />
                {unitPrefix ? ` ${unitPrefix}` : ''}
            </>
        )
    }
}

export const getTextRender = (search?: string) => {
    return function render (text: string): RenderReturnType {
        return renderHighlightedCellContents(search, text)
    }
}

const getIntegerPartOfReading = (value: string) => value?.split(DEFAULT_CURRENCY_SEPARATOR)[0]

export const renderMeterReading = (values: string[], resourceId: string, measure: string) => {
    // ELECTRICITY multi-tariff meter
    if (resourceId === ELECTRICITY_METER_RESOURCE_ID) {
        const stringValues = values.reduce((acc, value, index) => {
            if (!value) return acc

            return `${acc}, T${index + 1} - ${getIntegerPartOfReading(value)} ${measure}`
        }, '')

        return stringValues?.substr(2)
    }

    // other resource 1-tariff meter
    return `${getIntegerPartOfReading(values[0])} ${measure}`
}

const dimText = (text: string, extraStyles: React.CSSProperties = {}) => (
    <Typography.Text type={'secondary'} style={extraStyles}>
        {text}
    </Typography.Text>
)

const renderMoney = (formattedValue: Intl.NumberFormatPart[]) => {
    const prefix = []
    const decimalAndFraction = []
    const postfix = []

    let decimalAndFractionProcessedFlag = false

    formattedValue.forEach(token => {
        switch (token.type) {
            case 'decimal':
            case 'fraction':
                decimalAndFraction.push(token.value)
                decimalAndFractionProcessedFlag = true
                break
            default:
                if (decimalAndFractionProcessedFlag) {
                    postfix.push(token.value)
                } else {
                    prefix.push(token.value)
                }
        }
    })

    return (<>{prefix.join('')}{dimText(decimalAndFraction.join(''))}{postfix.join('')}</>)
}

export const getMoneyRender = (
    search: string,
    intl,
    currencyCode = DEFAULT_CURRENCY_CODE
) => {
    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>

        const formattedCurrency = intl.formatNumberToParts(
            parseFloat(text),
            { style: 'currency', currency: currencyCode }
        )

        if (isEmpty(search)) return renderMoney(formattedCurrency)

        return (
            <>
                <TextHighlighter
                    text={text}
                    search={search}
                    renderPart={() => renderMoney(formattedCurrency)}
                />
            </>
        )
    }
}