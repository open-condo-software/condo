import React from 'react'
import { Typography } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { FilterValue } from 'antd/es/table/interface'

import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'
import { TTextHighlighterRenderPartFN } from '@condo/domains/common/components/TextHighlighter'

import { LOCALES } from '../../constants/locale'
import { QueryArgType } from '../../utils/tables.utils'
import { TextHighlighter, TTextHighlighterProps } from '../TextHighlighter'
import { ELLIPSIS_ROWS } from '../../constants/style'

import { EmptyTableCell } from './EmptyTableCell'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'
const DEFAULT_CURRENCY_CODE = 'RUB'
const ELLIPSIS_SETTINGS = { rows: ELLIPSIS_ROWS, expandable: false }
const ELLIPSIS_STYLES = { marginBottom: 0 }
const DATE_FORMAT_LONG = 'DD MMM YYYY'
const DATE_FORMAT_SHORT = 'DD MMM'

/**
 * Marks text according to marked flag
 * @param part
 * @param startIndex
 * @param marked
 */
export const renderHighlightedPart: TTextHighlighterRenderPartFN = (
    part,
    startIndex,
    marked,
    type,
    style
) => (
    <Typography.Text mark={marked} type={type} style={style}>
        {part}
    </Typography.Text>
)

/**
 * Type for getHighlightedContents fn
 */
type TGetHighlightedFN = (search?: FilterValue | string, postfix?: string | React.FC, extraProps?: Partial<TTextHighlighterProps>) => (text?: string) => React.ReactElement | string

/**
 * Returned function renders provided text with highlighted parts according to search value
 * @param search
 * @param postfix
 */
export const getHighlightedContents: TGetHighlightedFN = (search, postfix, extraProps) => (text) => {
    // Sometimes we can receive null/undefined as text
    const renderText = text ? String(text) : ''

    let ResultPostfix
    if (typeof postfix === 'function') {
        ResultPostfix = postfix
    } else {
        ResultPostfix = () => (
            <Typography.Text>{postfix}</Typography.Text>
        )
    }

    return (
        <TextHighlighter
            text={renderText}
            search={String(search)}
            renderPart={renderHighlightedPart}
            {...extraProps}
        >
            <ResultPostfix />
        </TextHighlighter>
    )
}


/**
 * Type for getTableCellRenderer fn
 */
type TTableCellRendererFN =  (search?: FilterValue | string, ellipsis?: boolean, postfix?: string | React.FC, extraHighlighterProps?: Partial<TTextHighlighterProps>) => (text?: string) => React.ReactElement

/**
 * Returned function renders provided text as a cell with highlighted search and multi row ellipsis (if requested)
 * !!! Attention: ellipsis here does not work properly, if ellipsis is also enabled in table column settings for this field, so please remove it from there.
 * @param search
 * @param ellipsis
 * @param postfix
 * @return cell contents renderer fn
 */
export const getTableCellRenderer: TTableCellRendererFN = (
    search,
    ellipsis = false,
    postfix = '',
    extraHighlighterProps
) =>
    (text) => {
        const highlightedContent = getHighlightedContents(search, postfix, extraHighlighterProps)(text)

        if (!ellipsis) return <EmptyTableCell>{highlightedContent}</EmptyTableCell>

        return (
            <EmptyTableCell>
                <Typography.Paragraph ellipsis={ELLIPSIS_SETTINGS} title={`${text} ${postfix || ''}`} style={ELLIPSIS_STYLES}>
                    {highlightedContent}
                </Typography.Paragraph>
            </EmptyTableCell>
        )
    }

/**
 * Renders provided text as a table cell with highlighted search contents
 * @param search
 * @param text
 */
export const renderCellWithHighlightedContents = (search?: FilterValue | string, text?: string) => (
    <EmptyTableCell>{getHighlightedContents(search)(text)}</EmptyTableCell>
)

export const getDateRender = (intl, search?: string, short?: boolean) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        const dateFormat = short ? DATE_FORMAT_SHORT : DATE_FORMAT_LONG

        return renderCellWithHighlightedContents(search, date.format(dateFormat))
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
        return renderCellWithHighlightedContents(search, text)
    }
}

const getIntegerPartOfReading = (value: string) => value?.split(DEFAULT_CURRENCY_SEPARATOR)[0]

export const renderMeterReading = (values: string[], resourceId: string, measure: string) => {
    // ELECTRICITY multi-tariff meter
    if (resourceId === ELECTRICITY_METER_RESOURCE_ID) {
        const formatMeter = (value, index) => <>{`T${index + 1} - ${getIntegerPartOfReading(value)} ${measure}`}<br /></>

        return values.filter(Boolean).map(formatMeter)
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

    return (<>
        {prefix.join('')}
        {dimText(decimalAndFraction.join(''))}
        {postfix.join('')}
    </>)
}

export const getMoneyRender = (
    search: string,
    intl,
    currencyCode = DEFAULT_CURRENCY_CODE
) => {
    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>

        const formattedCurrency = intl.formatNumberToParts(parseFloat(text), { style: 'currency', currency: currencyCode })

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