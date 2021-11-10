import React from 'react'
import { Typography } from 'antd'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { FilterValue } from 'antd/es/table/interface'

import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'
import { TTextHighlighterRenderPartFN } from '@condo/domains/common/components/TextHighlighter'

import { LOCALES } from '../../constants/locale'
import { TextHighlighter, TTextHighlighterProps } from '../TextHighlighter'
import { ELLIPSIS_ROWS } from '../../constants/style'

import { EmptyTableCell } from './EmptyTableCell'
import { Property } from '../../../../schema'
import { getAddressDetailsWithoutUnit } from '../../utils/helpers'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'
const DEFAULT_CURRENCY_CODE = 'RUB'
const ELLIPSIS_SETTINGS = { rows: ELLIPSIS_ROWS, expandable: false }
const ELLIPSIS_STYLES = { marginBottom: 0 }
const DATE_FORMAT = 'DD.MM.YYYY'
const TIME_FORMAT = 'hh:mm'

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
type TGetHighlightedFN = (search?: FilterValue | string, postfix?: string, extraProps?: Partial<TTextHighlighterProps>, extraPostfixProps?: TextProps) => (text?: string) => React.ReactElement | string

/**
 * Returned function renders provided text with highlighted parts according to search value
 * @param search
 * @param postfix
 * @param extraProps
 * @param extraPostfixProps
 */
export const getHighlightedContents: TGetHighlightedFN = (search, postfix, extraProps, extraPostfixProps = {}) => (text) => {
    // Sometimes we can receive null/undefined as text
    const renderText = text ? String(text) : ''
    const title = `${text} ${postfix || ''}`

    const getPostfix = () => (
        <Typography.Text title={title} {...extraPostfixProps}>
            {postfix}
        </Typography.Text>
    )

    return (
        <TextHighlighter
            text={renderText}
            search={String(search)}
            renderPart={renderHighlightedPart}
            title={title}
            {...extraProps}
        >
            {postfix && getPostfix()}
        </TextHighlighter>
    )
}


/**
 * Type for getTableCellRenderer fn
 */
type TTableCellRendererFN = (search?: FilterValue | string, ellipsis?: boolean, postfix?: string, extraHighlighterProps?: Partial<TTextHighlighterProps>, extraPostfixProps?: TextProps) => (text?: string) => React.ReactElement

/**
 * Returned function renders provided text as a cell with highlighted search and multi row ellipsis (if requested)
 * !!! Attention: ellipsis here does not work properly, if ellipsis is also enabled in table column settings for this field, so please remove it from there.
 * @param search
 * @param ellipsis
 * @param postfix
 * @param extraHighlighterProps
 * @param extraPostfixProps
 * @return cell contents renderer fn
 */
export const getTableCellRenderer: TTableCellRendererFN = (
    search,
    ellipsis = false,
    postfix = '',
    extraHighlighterProps,
    extraPostfixProps
) =>
    (text) => {
        const title = `${text} ${postfix || ''}`
        const highlightedContent = getHighlightedContents(search, postfix, extraHighlighterProps, extraPostfixProps)(text)

        if (!ellipsis) return <EmptyTableCell>{text && highlightedContent}</EmptyTableCell>

        return (
            <EmptyTableCell>
                {
                    text && (
                        <Typography.Paragraph ellipsis={ELLIPSIS_SETTINGS} title={title} style={ELLIPSIS_STYLES}>
                            {highlightedContent}
                        </Typography.Paragraph>
                    )
                }
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

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string) => {
    const isDeleted = !!get(property, 'deletedAt')
    const { streetLine, regionLine, cityLine } = getAddressDetailsWithoutUnit(property)
    const extraProps: Partial<TTextHighlighterProps> = isDeleted && { type: 'secondary' }
    const postfix = `\n${regionLine}, \n${cityLine} ${isDeleted && DeletedMessage ? `(${DeletedMessage})\n` : '\n'}`

    return getTableCellRenderer(search, false, postfix, extraProps, POSTFIX_PROPS)(streetLine)
}

export const getDateRender = (intl, search?: FilterValue | string) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        const text = `${date.format(DATE_FORMAT)},`
        const postfix = `\n${date.format(TIME_FORMAT)}`

        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS)(text)
    }
}

export const getTextRender = (search?: FilterValue | string) => {
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